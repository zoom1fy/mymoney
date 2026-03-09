import { ITransaction, TransactionType } from '@/types/transaction.types'

export interface DonutItem {
  id: number
  name: string
  value: number
  color: string
}

export interface Category {
  id: number
  name: string
  color?: string
}

const COLORS = [
  '#6366F1',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#A855F7',
  '#F97316'
]

export function buildDonutData(
  transactions: ITransaction[],
  type: TransactionType,
  categories: Category[]
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

      // ❗ гарантия корректного цвета
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
