import { getDb } from './db'

export interface ICurrency {
  code: string
  name: string
  symbol: string
  type: 'FIAT' | 'CRYPTO'
}

export const currencyLocalService = {
  async getAll(): Promise<ICurrency[]> {
    const db = await getDb()

    return db.select<ICurrency[]>(
      'SELECT code, name, symbol, type FROM "Currency" ORDER BY code ASC'
    )
  }
}
