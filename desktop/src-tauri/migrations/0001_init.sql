-- MyMoney desktop schema (SQLite). Mirrors backend/src/prisma/contract.prisma.
-- Conventions: Uuid -> TEXT, Decimal -> TEXT (decimal string), Boolean -> INTEGER (0/1),
-- DateTime -> TEXT (ISO 8601). Table/column names match the web database 1:1.

CREATE TABLE "User" (
    id           TEXT PRIMARY KEY,
    email        TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    createdAt    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    lastLogin    TEXT
);

CREATE TABLE "Currency" (
    code   TEXT PRIMARY KEY,
    name   TEXT NOT NULL,
    symbol TEXT NOT NULL,
    type   TEXT NOT NULL CHECK (type IN ('FIAT', 'CRYPTO'))
);

CREATE TABLE "ExchangeRate" (
    "from"     TEXT NOT NULL REFERENCES "Currency" ("code"),
    "to"       TEXT NOT NULL REFERENCES "Currency" ("code"),
    rate       TEXT NOT NULL,
    updatedAt  TEXT NOT NULL,
    PRIMARY KEY ("from", "to")
);

CREATE TABLE "AccountCategory" (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE "AccountType" (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE "Account" (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    userId         TEXT NOT NULL REFERENCES "User" ("id") ON DELETE CASCADE,
    categoryId     INTEGER NOT NULL REFERENCES "AccountCategory" ("id"),
    typeId         INTEGER NOT NULL REFERENCES "AccountType" ("id"),
    currencyCode   TEXT NOT NULL REFERENCES "Currency" ("code"),
    name           TEXT NOT NULL,
    icon           TEXT NOT NULL DEFAULT 'default',
    currentBalance TEXT NOT NULL DEFAULT '0',
    isDeleted      INTEGER NOT NULL DEFAULT 0,
    createdAt      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updatedAt      TEXT
);

CREATE TABLE "Category" (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    userId       TEXT NOT NULL REFERENCES "User" ("id") ON DELETE CASCADE,
    name         TEXT NOT NULL,
    icon         TEXT NOT NULL DEFAULT 'default',
    currencyCode TEXT NOT NULL REFERENCES "Currency" ("code"),
    color        TEXT,
    isExpense    INTEGER NOT NULL,
    parentId     INTEGER REFERENCES "Category" ("id") ON DELETE SET NULL,
    isArchived   INTEGER NOT NULL DEFAULT 0,
    createdAt    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

    UNIQUE (userId, name)
);

CREATE TABLE "Transaction" (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    userId          TEXT NOT NULL REFERENCES "User" ("id") ON DELETE CASCADE,
    accountId       INTEGER NOT NULL REFERENCES "Account" ("id") ON DELETE CASCADE,
    targetAccountId INTEGER REFERENCES "Account" ("id") ON DELETE CASCADE,
    categoryId      INTEGER REFERENCES "Category" ("id") ON DELETE SET NULL,
    amount          TEXT NOT NULL,
    currencyCode    TEXT NOT NULL REFERENCES "Currency" ("code"),
    transactionDate TEXT NOT NULL,
    description     TEXT,
    type            TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER')),
    createdAt       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_account_user_id ON "Account" (userId);
CREATE INDEX idx_category_user_id ON "Category" (userId);
CREATE INDEX idx_transaction_user_id ON "Transaction" (userId);
CREATE INDEX idx_transaction_account_id ON "Transaction" (accountId);
CREATE INDEX idx_transaction_transaction_date ON "Transaction" (transactionDate);
