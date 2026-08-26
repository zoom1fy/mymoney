import { DonutItem } from '@/lib/transactions-donut'

import {
  ICreateTransaction,
  ITransaction,
  ITransactionResponse,
  IUpdateTransaction,
  TransactionType
} from '../../types/transaction.type'
import { getDb, LOCAL_USER_ID } from './db'
import { money } from './helpers'

type TxRow = Record<string, unknown>

export interface ISummaryItem {
  categoryId: number | null
  categoryName: string | null
  categoryColor: string | null
  totalAmount: number
}

function mapTx(row: TxRow): ITransaction {
  const nullable = (v: unknown) => (v === null || v === undefined ? undefined : Number(v))

  return {
    id: Number(row.id),
    accountId: Number(row.accountId),
    targetAccountId: nullable(row.targetAccountId),
    categoryId: nullable(row.categoryId),
    amount: Number(row.amount),
    currencyCode: String(row.currencyCode),
    transactionDate: String(row.transactionDate),
    description: row.description === null || row.description === undefined ? undefined : String(row.description),
    type: String(row.type) as TransactionType,
    createdAt: String(row.createdAt ?? ''),
    updatedAt: ''
  }
}

// Applies a signed delta to an account balance, mirroring the web backend.
// Statements run sequentially without a wrapping SQL transaction because
// tauri-plugin-sql exposes no cross-statement transaction API; the database is
// embedded and single-user, so the failure window only affects crash recovery.
async function adjustBalance(accountId: number, delta: number): Promise<void> {
  const db = await getDb()
  const rows = await db.select<TxRow[]>(
    'SELECT currentBalance FROM "Account" WHERE id = $1 AND userId = $2',
    [accountId, LOCAL_USER_ID]
  )
  if (!rows[0]) throw new Error('Аккаунт не найден')

  await db.execute('UPDATE "Account" SET currentBalance = $1 WHERE id = $2', [
    money(Number(rows[0].currentBalance) + delta),
    accountId
  ])
}

async function getOwnedAccount(id: number): Promise<TxRow> {
  const db = await getDb()
  const rows = await db.select<TxRow[]>(
    'SELECT * FROM "Account" WHERE id = $1 AND userId = $2',
    [id, LOCAL_USER_ID]
  )

  return rows[0]
}

async function getOwnedCategory(id: number): Promise<TxRow> {
  const db = await getDb()
  const rows = await db.select<TxRow[]>(
    'SELECT * FROM "Category" WHERE id = $1 AND userId = $2',
    [id, LOCAL_USER_ID]
  )

  return rows[0]
}

async function findOwnedById(id: number): Promise<ITransaction | null> {
  const db = await getDb()
  const rows = await db.select<TxRow[]>(
    `SELECT t.* FROM "Transaction" t
     JOIN "Account" a ON a.id = t.accountId
     WHERE t.id = $1 AND a.userId = $2`,
    [id, LOCAL_USER_ID]
  )

  return rows[0] ? mapTx(rows[0]) : null
}

// Reverts or applies a transaction's balance effect; shared by update and delete
async function applyEffect(
  type: TransactionType,
  accountId: number,
  targetAccountId: number | null | undefined,
  amount: number,
  direction: 1 | -1
): Promise<void> {
  if (type === TransactionType.INCOME) {
    await adjustBalance(accountId, direction * amount)
  } else if (type === TransactionType.EXPENSE) {
    await adjustBalance(accountId, -direction * amount)
  } else if (type === TransactionType.TRANSFER) {
    await adjustBalance(accountId, -direction * amount)
    if (targetAccountId) {
      await adjustBalance(targetAccountId, direction * amount)
    }
  }
}

export const transactionLocalService = {
  async create(data: ICreateTransaction): Promise<ITransaction> {
    const account = await getOwnedAccount(data.accountId)
    if (!account) throw new Error('Аккаунт не найден')

    if (data.type !== TransactionType.TRANSFER) {
      if (data.categoryId === undefined) {
        throw new Error('categoryId обязателен для данного типа транзакции')
      }

      const category = await getOwnedCategory(data.categoryId)
      if (!category) throw new Error('Категория не найдена')
    }

    const value = Number(data.amount)
    if (!value || value <= 0) {
      throw new Error('Сумма должна быть положительным числом')
    }

    if (data.type === TransactionType.TRANSFER) {
      if (!data.targetAccountId) {
        throw new Error('Для перевода нужен целевой аккаунт')
      }

      const target = await getOwnedAccount(data.targetAccountId)
      if (!target) throw new Error('Целевой аккаунт не найден')
    }

    if (data.type === TransactionType.INCOME) {
      await adjustBalance(data.accountId, value)
    } else if (data.type === TransactionType.EXPENSE) {
      await adjustBalance(data.accountId, -value)
    } else if (data.type === TransactionType.TRANSFER) {
      await adjustBalance(data.accountId, -value)
      await adjustBalance(data.targetAccountId as number, value)
    }

    const db = await getDb()
    const result = await db.execute(
      `INSERT INTO "Transaction"
         (userId, accountId, targetAccountId, categoryId, amount, currencyCode,
          transactionDate, description, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        LOCAL_USER_ID,
        data.accountId,
        data.targetAccountId ?? null,
        data.categoryId ?? null,
        money(value),
        data.currencyCode,
        data.transactionDate ? new Date(data.transactionDate).toISOString() : new Date().toISOString(),
        data.description ?? null,
        data.type
      ]
    )

    const created = await findOwnedById(Number(result.lastInsertId))
    if (!created) throw new Error('Транзакция не найдена')

    return created
  },

  async getAll(
    cursor?: number,
    options?: { from?: Date; to?: Date }
  ): Promise<ITransactionResponse> {
    const take = 20

    let where = 't.userId = $1'
    const params: unknown[] = [LOCAL_USER_ID]

    if (options?.from) {
      params.push(options.from.toISOString())
      where += ` AND t.transactionDate >= $${params.length}`
    }
    if (options?.to) {
      params.push(options.to.toISOString())
      where += ` AND t.transactionDate <= $${params.length}`
    }

    // Keyset pagination on (transactionDate DESC, id DESC); the cursor is the
    // id of the last item of the previous page
    if (cursor !== undefined) {
      params.push(cursor)
      const cursorParam = `$${params.length}`
      where += ` AND (
        t.transactionDate < (SELECT transactionDate FROM "Transaction" WHERE id = ${cursorParam})
        OR (
          t.transactionDate = (SELECT transactionDate FROM "Transaction" WHERE id = ${cursorParam})
          AND t.id < ${cursorParam}
        )
      )`
    }

    const db = await getDb()
    const results = await db.select<TxRow[]>(
      `SELECT t.* FROM "Transaction" t WHERE ${where}
       ORDER BY t.transactionDate DESC, t.id DESC
       LIMIT $${params.length + 1}`,
      [...params, take + 1]
    )

    let nextCursor: number | null = null
    if (results.length > take) {
      const extra = results.pop()
      nextCursor = extra ? Number(extra.id) : null
    }

    return { data: results.map(mapTx), nextCursor }
  },

  async getForPeriod(from: Date, to: Date): Promise<ITransaction[]> {
    const db = await getDb()
    const rows = await db.select<TxRow[]>(
      `SELECT t.* FROM "Transaction" t
       WHERE t.userId = $1 AND t.transactionDate >= $2 AND t.transactionDate <= $3
       ORDER BY t.transactionDate DESC, t.id DESC
       LIMIT 1000`,
      [LOCAL_USER_ID, from.toISOString(), to.toISOString()]
    )

    return rows.map(mapTx)
  },

  // Aggregated totals per category in RUB; consumed by both the donut service
  // wrapper and the dashboard adapter
  async getSummaryRaw(fromIso: string, toIso: string, type: TransactionType): Promise<ISummaryItem[]> {
    const db = await getDb()

    const rows = await db.select<TxRow[]>(
      `SELECT t.categoryId AS categoryId, c.name AS categoryName, c.color AS categoryColor,
              t.currencyCode AS currencyCode, SUM(CAST(t.amount AS REAL)) AS total
       FROM "Transaction" t
       LEFT JOIN "Category" c ON c.id = t.categoryId
       WHERE t.userId = $1 AND t.type = $2 AND t.transactionDate >= $3 AND t.transactionDate <= $4
       GROUP BY t.categoryId, c.name, c.color, t.currencyCode`,
      [LOCAL_USER_ID, type, fromIso, toIso]
    )
    if (rows.length === 0) return []

    const rateRows = await db.select<{ from: string; rate: number }[]>(
      'SELECT "from", CAST(rate AS REAL) AS rate FROM "ExchangeRate" WHERE "to" = \'RUB\''
    )
    const rateMap = new Map<string, number>(rateRows.map(r => [r.from, Number(r.rate)]))
    rateMap.set('RUB', 1)

    const rubTotals = new Map<number, { name: string; color: string | null; total: number }>()

    for (const row of rows) {
      // Stored rates are refreshed lazily by the exchange-rate sync;
      // unknown currencies fall back to 1 so totals stay visible
      const rate = rateMap.get(String(row.currencyCode)) ?? 1
      const rubAmount = Number(row.total) * rate

      const categoryId = row.categoryId === null || row.categoryId === undefined ? 0 : Number(row.categoryId)
      const existing = rubTotals.get(categoryId)
      if (existing) {
        existing.total += rubAmount
      } else {
        rubTotals.set(categoryId, {
          name: row.categoryName === null ? 'Без категории' : String(row.categoryName),
          color: row.categoryColor === null ? null : String(row.categoryColor),
          total: rubAmount
        })
      }
    }

    return Array.from(rubTotals.entries())
      .map(([categoryId, { name, color, total }]) => ({
        categoryId: categoryId === 0 ? null : categoryId,
        categoryName: name,
        categoryColor: color,
        totalAmount: Math.round(total * 100) / 100
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
  },

  async getSummary(from: Date, to: Date, type: TransactionType): Promise<DonutItem[]> {
    const items = await this.getSummaryRaw(from.toISOString(), to.toISOString(), type)

    return items.map(item => ({
      id: item.categoryId ?? 0,
      name: item.categoryName ?? 'Без категории',
      value: item.totalAmount,
      color:
        item.categoryColor && item.categoryColor.startsWith('#')
          ? item.categoryColor
          : '#cccccc'
    })) as DonutItem[]
  },

  async getById(id: number): Promise<ITransaction> {
    const tx = await findOwnedById(id)
    if (!tx) throw new Error('Транзакция не найдена')

    return tx
  },

  async update(id: number, data: IUpdateTransaction): Promise<ITransaction> {
    const tx = await findOwnedById(id)
    if (!tx) throw new Error('Транзакция не найдена')

    const newAccountId = data.accountId !== undefined ? data.accountId : tx.accountId
    const newTargetAccountId =
      data.targetAccountId !== undefined ? data.targetAccountId : tx.targetAccountId

    for (const accountId of [newAccountId, newTargetAccountId]) {
      if (accountId === null || accountId === undefined) continue

      const account = await getOwnedAccount(accountId)
      if (account && account.isDeleted === 1) {
        throw new Error('Нельзя обновить транзакцию: счёт удалён')
      }
    }

    const oldAmount = Number(tx.amount)
    const newAmount = data.amount !== undefined ? Number(data.amount) : oldAmount
    const newType = data.type ?? tx.type

    await applyEffect(
      tx.type,
      tx.accountId,
      tx.targetAccountId,
      oldAmount,
      -1
    )
    await applyEffect(newType, newAccountId, newTargetAccountId, newAmount, 1)

    const db = await getDb()
    await db.execute(
      `UPDATE "Transaction" SET
         accountId = $1, targetAccountId = $2, categoryId = $3, amount = $4,
         currencyCode = $5, description = $6, type = $7, transactionDate = $8
       WHERE id = $9`,
      [
        newAccountId,
        newTargetAccountId ?? null,
        data.categoryId ?? tx.categoryId ?? null,
        money(newAmount),
        data.currencyCode ?? tx.currencyCode,
        data.description !== undefined ? data.description ?? null : tx.description ?? null,
        newType,
        data.transactionDate ? new Date(data.transactionDate).toISOString() : tx.transactionDate,
        id
      ]
    )

    return this.getById(id)
  },

  async delete(id: number): Promise<void> {
    const tx = await findOwnedById(id)
    if (!tx) throw new Error('Транзакция не найдена')

    await applyEffect(tx.type, tx.accountId, tx.targetAccountId, Number(tx.amount), -1)

    const db = await getDb()
    await db.execute('DELETE FROM "Transaction" WHERE id = $1', [id])
  }
}
