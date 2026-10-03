-- Account balances are maintained by triggers on "Transaction" so that every
-- balance change is atomic with the row mutation. tauri-plugin-sql does not
-- expose transactions (each statement may run on a different pooled
-- connection), so triggers are the only way to keep "Account" and
-- "Transaction" consistent if the app crashes mid-operation.
-- The JS layer no longer adjusts balances itself.

-- INCOME adds to the source account, EXPENSE and the source side of a
-- TRANSFER subtract from it. The target side of a TRANSFER adds.
CREATE TRIGGER trg_transaction_balance_after_insert
AFTER INSERT ON "Transaction"
BEGIN
    UPDATE "Account"
       SET currentBalance = CAST(ROUND(CAST(currentBalance AS REAL) + CASE
               WHEN NEW.type = 'INCOME'   THEN CAST(NEW.amount AS REAL)
               WHEN NEW.type = 'EXPENSE'  THEN -CAST(NEW.amount AS REAL)
               WHEN NEW.type = 'TRANSFER' THEN -CAST(NEW.amount AS REAL)
               ELSE 0
           END, 2) AS TEXT)
     WHERE id = NEW.accountId;

    UPDATE "Account"
       SET currentBalance = CAST(ROUND(CAST(currentBalance AS REAL) + CAST(NEW.amount AS REAL), 2) AS TEXT)
     WHERE NEW.type = 'TRANSFER' AND NEW.targetAccountId IS NOT NULL AND id = NEW.targetAccountId;
END;

CREATE TRIGGER trg_transaction_balance_after_update
AFTER UPDATE ON "Transaction"
BEGIN
    -- Revert the previous row state, then apply the new one. When only
    -- non-financial columns change the two steps cancel out.
    UPDATE "Account"
       SET currentBalance = CAST(ROUND(CAST(currentBalance AS REAL) - CASE
               WHEN OLD.type = 'INCOME'   THEN CAST(OLD.amount AS REAL)
               WHEN OLD.type = 'EXPENSE'  THEN -CAST(OLD.amount AS REAL)
               WHEN OLD.type = 'TRANSFER' THEN -CAST(OLD.amount AS REAL)
               ELSE 0
           END, 2) AS TEXT)
     WHERE id = OLD.accountId;

    UPDATE "Account"
       SET currentBalance = CAST(ROUND(CAST(currentBalance AS REAL) - CAST(OLD.amount AS REAL), 2) AS TEXT)
     WHERE OLD.type = 'TRANSFER' AND OLD.targetAccountId IS NOT NULL AND id = OLD.targetAccountId;

    UPDATE "Account"
       SET currentBalance = CAST(ROUND(CAST(currentBalance AS REAL) + CASE
               WHEN NEW.type = 'INCOME'   THEN CAST(NEW.amount AS REAL)
               WHEN NEW.type = 'EXPENSE'  THEN -CAST(NEW.amount AS REAL)
               WHEN NEW.type = 'TRANSFER' THEN -CAST(NEW.amount AS REAL)
               ELSE 0
           END, 2) AS TEXT)
     WHERE id = NEW.accountId;

    UPDATE "Account"
       SET currentBalance = CAST(ROUND(CAST(currentBalance AS REAL) + CAST(NEW.amount AS REAL), 2) AS TEXT)
     WHERE NEW.type = 'TRANSFER' AND NEW.targetAccountId IS NOT NULL AND id = NEW.targetAccountId;
END;

CREATE TRIGGER trg_transaction_balance_after_delete
AFTER DELETE ON "Transaction"
BEGIN
    UPDATE "Account"
       SET currentBalance = CAST(ROUND(CAST(currentBalance AS REAL) - CASE
               WHEN OLD.type = 'INCOME'   THEN CAST(OLD.amount AS REAL)
               WHEN OLD.type = 'EXPENSE'  THEN -CAST(OLD.amount AS REAL)
               WHEN OLD.type = 'TRANSFER' THEN -CAST(OLD.amount AS REAL)
               ELSE 0
           END, 2) AS TEXT)
     WHERE id = OLD.accountId;

    UPDATE "Account"
       SET currentBalance = CAST(ROUND(CAST(currentBalance AS REAL) - CAST(OLD.amount AS REAL), 2) AS TEXT)
     WHERE OLD.type = 'TRANSFER' AND OLD.targetAccountId IS NOT NULL AND id = OLD.targetAccountId;
END;
