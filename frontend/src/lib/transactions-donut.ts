import { ICategory } from '@/types/category.types'
import { ITransaction, TransactionType } from '@/types/transaction.types'

export interface DonutItem {
  id: number
  name: string
  value: number
  color: string
}

// Aggregates transaction amounts by category for a donut chart; filters by INCOME or EXPENSE
export function buildDonutData(
  transactions: ITransaction[],
  type: TransactionType,
  categories: ICategory[]
): DonutItem[] {
  const categoryMap = new Map(
    categories.map(c => [c.id, { name: c.name, color: c.color }])
  )

  const map = new Map<
    number,
    { id: number; name: string; value: number; color: string }
  >()

  transactions
    .filter(t => t.type === type)
    .forEach(t => {
      const id = t.categoryId ?? 0
      const category = categoryMap.get(id)

      const name = category?.name ?? 'Без категории'

      // Fallback to gray when category lacks a valid hex color
      const color =
        category?.color && category.color.startsWith('#')
          ? category.color
          : '#cccccc'

      if (!map.has(id)) {
        map.set(id, { id, name, value: 0, color })
      }

      map.get(id)!.value += t.amount
    })

  return Array.from(map.values())
}
