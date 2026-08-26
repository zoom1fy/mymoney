import {
  ICategory,
  ICreateCategory,
  IUpdateCategory
} from '../../types/category.type'
import { getDb, LOCAL_USER_ID } from './db'
import { toBool } from './helpers'

type CategoryRow = Record<string, unknown>

function mapCategory(row: CategoryRow): ICategory {
  return {
    id: Number(row.id),
    name: String(row.name),
    icon: String(row.icon),
    currencyCode: String(row.currencyCode),
    color: String(row.color ?? ''),
    isExpense: toBool(row.isExpense),
    parentId: row.parentId === null || row.parentId === undefined ? undefined : Number(row.parentId),
    isArchived: toBool(row.isArchived),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt ?? '')
  }
}

export const categoryLocalService = {
  async create(dto: ICreateCategory): Promise<ICategory> {
    const db = await getDb()

    const duplicates = await db.select<CategoryRow[]>(
      'SELECT id FROM "Category" WHERE userId = $1 AND name = $2 AND isArchived = 0',
      [LOCAL_USER_ID, dto.name]
    )
    if (duplicates[0]) {
      throw new Error('Категория с таким именем уже существует')
    }

    if (dto.parentId) {
      const parents = await db.select<CategoryRow[]>(
        'SELECT * FROM "Category" WHERE id = $1 AND userId = $2',
        [dto.parentId, LOCAL_USER_ID]
      )
      const parent = parents[0]
      if (!parent) throw new Error('Родительская категория не найдена')
      if (toBool(parent.isArchived)) {
        throw new Error('Нельзя создавать подкатегорию внутри архивной категории')
      }
    }

    const result = await db.execute(
      `INSERT INTO "Category" (userId, name, icon, currencyCode, color, isExpense, parentId)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        LOCAL_USER_ID,
        dto.name,
        dto.icon ?? 'default',
        dto.currencyCode,
        dto.color ?? '',
        dto.isExpense ? 1 : 0,
        dto.parentId ?? null
      ]
    )

    const rows = await db.select<CategoryRow[]>('SELECT * FROM "Category" WHERE id = $1', [
      Number(result.lastInsertId)
    ])

    return mapCategory(rows[0])
  },

  async getAll(): Promise<ICategory[]> {
    const db = await getDb()
    const rows = await db.select<CategoryRow[]>(
      'SELECT * FROM "Category" WHERE userId = $1 AND isArchived = 0 ORDER BY createdAt ASC',
      [LOCAL_USER_ID]
    )

    return rows.map(mapCategory)
  },

  async getById(id: number): Promise<ICategory> {
    const category = await this.findById(id)
    if (!category) throw new Error('Категория не найдена')

    return category
  },

  async findById(id: number): Promise<ICategory | null> {
    const db = await getDb()
    const rows = await db.select<CategoryRow[]>(
      'SELECT * FROM "Category" WHERE id = $1 AND userId = $2',
      [id, LOCAL_USER_ID]
    )

    return rows[0] ? mapCategory(rows[0]) : null
  },

  async update(id: number, dto: IUpdateCategory): Promise<ICategory> {
    const existing = await this.getById(id)

    if (existing.isArchived) {
      throw new Error('Нельзя редактировать архивную категорию')
    }

    if (dto.name && dto.name !== existing.name) {
      const db = await getDb()
      const conflicts = await db.select<CategoryRow[]>(
        'SELECT id FROM "Category" WHERE userId = $1 AND name = $2 AND isArchived = 0 AND id != $3',
        [LOCAL_USER_ID, dto.name, id]
      )
      if (conflicts[0]) {
        throw new Error('Другая активная категория с таким именем уже существует')
      }
    }

    if (dto.parentId && dto.parentId !== existing.parentId) {
      const parent = await this.getById(dto.parentId)
      if (parent.isArchived) {
        throw new Error('Нельзя перенести категорию под архивную')
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
    if (dto.currencyCode !== undefined) addSet('currencyCode', dto.currencyCode)
    if (dto.color !== undefined) addSet('color', dto.color)
    if (dto.isExpense !== undefined) addSet('isExpense', dto.isExpense ? 1 : 0)
    if (dto.parentId !== undefined) addSet('parentId', dto.parentId)

    if (sets.length > 0) {
      await db.execute(
        `UPDATE "Category" SET ${sets.join(', ')} WHERE id = $${params.length + 1}`,
        [...params, id]
      )
    }

    return this.getById(id)
  },

  // Archives the category together with its direct children
  async delete(id: number): Promise<{ success: boolean }> {
    const existing = await this.getById(id)

    if (existing.isArchived) {
      return { success: true }
    }

    const db = await getDb()
    await db.execute('UPDATE "Category" SET isArchived = 1 WHERE id = $1', [id])
    await db.execute('UPDATE "Category" SET isArchived = 1 WHERE parentId = $1', [id])

    return { success: true }
  },

  async getArchived(): Promise<ICategory[]> {
    const db = await getDb()
    const rows = await db.select<CategoryRow[]>(
      'SELECT * FROM "Category" WHERE userId = $1 AND isArchived = 1 ORDER BY createdAt ASC',
      [LOCAL_USER_ID]
    )

    return rows.map(mapCategory)
  },

  async unarchive(id: number): Promise<ICategory> {
    const existing = await this.getById(id)

    if (!existing.isArchived) {
      return existing
    }

    if (existing.parentId) {
      const parent = await this.getById(existing.parentId)
      if (parent.isArchived) {
        throw new Error('Нельзя разархивировать категорию, пока её родитель в архиве')
      }
    }

    const db = await getDb()
    await db.execute('UPDATE "Category" SET isArchived = 0 WHERE id = $1', [id])
    await db.execute('UPDATE "Category" SET isArchived = 0 WHERE parentId = $1', [id])

    return this.getById(id)
  }
}
