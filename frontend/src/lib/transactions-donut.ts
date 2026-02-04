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
  const categoryMap = new Map(categories.map(c => [c.id, c.name]))

  const map = new Map<number, { id: number; name: string; value: number }>()

  transactions
    .filter(t => t.type === type)
    .forEach(t => {
      const id = t.categoryId ?? 0
      const name = categoryMap.get(id) ?? 'Без категории'

      if (!map.has(id)) {
        map.set(id, { id, name, value: 0 })
      }

      map.get(id)!.value += t.amount
    })

  return Array.from(map.values()).map((item, i) => ({
    ...item,
    color: COLORS[i % COLORS.length]
  }))
}
