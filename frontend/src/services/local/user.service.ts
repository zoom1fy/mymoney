import { IUser } from '../../types/auth.type'
import { getDb, LOCAL_USER_ID } from './db'

type UserRow = Record<string, unknown>

function mapProfile(row: UserRow): IUser {
  const email = String(row.email)

  return {
    id: String(row.id),
    email,
    // Same display-name derivation as the web backend
    name: email.split('@')[0]
  }
}

export const userLocalService = {
  async getProfile(): Promise<IUser> {
    const db = await getDb()
    const rows = await db.select<UserRow[]>(
      'SELECT id, email FROM "User" WHERE id = $1',
      [LOCAL_USER_ID]
    )
    if (!rows[0]) throw new Error('Пользователь не найден')

    return mapProfile(rows[0])
  },

  async updateProfile(data: {
    email?: string
    password?: string
    currentPassword: string
  }): Promise<IUser> {
    if (data.password) {
      throw new Error('Смена пароля недоступна в локальной версии')
    }

    const db = await getDb()

    if (data.email) {
      const current = await this.getProfile()
      if (data.email !== current.email) {
        const conflicts = await db.select<UserRow[]>(
          'SELECT id FROM "User" WHERE email = $1',
          [data.email]
        )
        if (conflicts[0]) throw new Error('Email уже используется')

        await db.execute('UPDATE "User" SET email = $1 WHERE id = $2', [
          data.email,
          LOCAL_USER_ID
        ])
      }
    }

    return this.getProfile()
  },

  async getById(id: string): Promise<IUser> {
    const db = await getDb()
    const rows = await db.select<UserRow[]>('SELECT id, email FROM "User" WHERE id = $1', [id])
    if (!rows[0]) throw new Error('Пользователь не найден')

    return mapProfile(rows[0])
  },

  async deleteUser(_id: string): Promise<void> {
    const db = await getDb()
    // Foreign keys cascade to accounts, categories and transactions
    await db.execute('DELETE FROM "User" WHERE id = $1', [LOCAL_USER_ID])
  }
}
