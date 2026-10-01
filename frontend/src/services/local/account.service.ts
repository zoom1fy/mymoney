import { IAccount, ICreateAccount, IUpdateAccount } from '../../types/account.type'
import { getDb, LOCAL_USER_ID } from './db'
import { money, toBool, toNumber } from './helpers'

type AccountRow = Record<string, unknown>

// Shapes the row like the web API: joined currency symbol, numeric balance, real booleans
function mapAccount(row: AccountRow): IAccount {
  return {
    id: toNumber(row.id),
    categoryId: toNumber(row.categoryId),
    typeId: toNumber(row.typeId),
    currencyCode: String(row.currencyCode),
    name: String(row.name),
    icon: String(row.icon),
    currentBalance: toNumber(row.currentBalance),
    isDeleted: toBool(row.isDeleted),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt ?? ''),
    currencySymbol: String(row.currencySymbol)
  }
}

const SELECT_WITH_CURRENCY = `
  SELECT a.*, c.symbol AS "currencySymbol"
  FROM "Account" a
  JOIN "Currency" c ON c.code = a.currencyCode`

async function getMappedById(id: number): Promise<IAccount | null> {
  const db = await getDb()
  const rows = await db.select<AccountRow[]>(
    `${SELECT_WITH_CURRENCY} WHERE a.id = $1 AND a.userId = $2`,
    [id, LOCAL_USER_ID]
  )

  return rows[0] ? mapAccount(rows[0]) : null
}

export const accountLocalService = {
  async create(dto: ICreateAccount): Promise<IAccount> {
    const db = await getDb()

    const duplicates = await db.select<AccountRow[]>(
      'SELECT id FROM "Account" WHERE userId = $1 AND name = $2 AND isDeleted = 0',
      [LOCAL_USER_ID, dto.name]
    )
    if (duplicates[0]) {
      throw new Error('Счёт с таким именем уже существует')
    }

    const balance =
      dto.currentBalance !== undefined && !Number.isNaN(dto.currentBalance)
        ? money(dto.currentBalance)
        : '0'

    const result = await db.execute(
      `INSERT INTO "Account" (userId, categoryId, typeId, currencyCode, name, icon, currentBalance)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        LOCAL_USER_ID,
        dto.categoryId,
        dto.typeId,
        dto.currencyCode,
        dto.name,
        dto.icon ?? 'default',
        balance
      ]
    )

    const created = await getMappedById(Number(result.lastInsertId))
    if (!created) throw new Error('Счёт не найден')

    return created
  },

  async getAll(): Promise<IAccount[]> {
    const db = await getDb()
    const rows = await db.select<AccountRow[]>(
      `${SELECT_WITH_CURRENCY} WHERE a.userId = $1 AND a.isDeleted = 0 ORDER BY a.createdAt ASC`,
      [LOCAL_USER_ID]
    )

    return rows.map(mapAccount)
  },

  async getById(id: number): Promise<IAccount> {
    const account = await getMappedById(id)
    if (!account) {
      throw new Error('Счёт не найден')
    }

    return account
  },

  async update(id: number, dto: IUpdateAccount): Promise<IAccount> {
    const existing = await this.getById(id)

    if (dto.name && dto.name !== existing.name) {
      const db = await getDb()
      const conflicts = await db.select<AccountRow[]>(
        'SELECT id FROM "Account" WHERE userId = $1 AND name = $2 AND isDeleted = 0 AND id != $3',
        [LOCAL_USER_ID, dto.name, id]
      )
      if (conflicts[0]) {
        throw new Error('Другой счёт с таким именем уже существует')
      }
    }

    const db = await getDb()
    const sets: string[] = []
    const params: unknown[] = []
    const addSet = (column: string, value: unknown) => {
      sets.push(`${column} = $${params.length + 1}`)
      params.push(value)
    }

    if (dto.name !== undefined) addSet('name', dto.name)
    if (dto.icon !== undefined) addSet('icon', dto.icon)
    if (dto.categoryId !== undefined) addSet('categoryId', dto.categoryId)
    if (dto.typeId !== undefined) addSet('typeId', dto.typeId)
    if (dto.currencyCode !== undefined) addSet('currencyCode', dto.currencyCode)
    if (dto.currentBalance !== undefined) addSet('currentBalance', money(dto.currentBalance))

    if (sets.length > 0) {
      addSet('updatedAt', new Date().toISOString())
      await db.execute(
        `UPDATE "Account" SET ${sets.join(', ')} WHERE id = $${params.length + 1}`,
        [...params, id]
      )
    }

    return this.getById(id)
  },

  async delete(id: number): Promise<{ message: string }> {
    await this.getById(id)

    const db = await getDb()
    await db.execute(
      'UPDATE "Account" SET isDeleted = 1, updatedAt = $2 WHERE id = $1 AND userId = $3',
      [id, new Date().toISOString(), LOCAL_USER_ID]
    )

    return { message: 'Счёт удалён' }
  }
}
