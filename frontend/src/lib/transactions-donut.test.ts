import { describe, it, expect } from 'vitest'
import { buildDonutData } from './transactions-donut'
import { TransactionType } from '@/types/transaction.type'
import type { ICategory } from '@/types/category.type'
import type { ITransaction } from '@/types/transaction.type'

describe('buildDonutData', () => {
  const categories: ICategory[] = [
    { id: 1, name: 'Food', color: '#ff0000', currencyCode: 'RUB', isExpense: true, icon: 'Circle', isArchived: false },
    { id: 2, name: 'Salary', color: '#00ff00', currencyCode: 'RUB', isExpense: false, icon: 'Circle', isArchived: false },
  ]

  const makeTx = (overrides: Partial<ITransaction>): ITransaction => ({
    id: 1,
    accountId: 1,
    categoryId: 1,
    amount: 100,
    type: TransactionType.EXPENSE,
    currencyCode: 'RUB',
    transactionDate: '2024-01-15T00:00:00.000Z',
    description: null,
    ...overrides,
  })

  it('groups EXPENSE transactions by category', () => {
    const transactions = [
      makeTx({ id: 1, categoryId: 1, amount: 50 }),
      makeTx({ id: 2, categoryId: 1, amount: 30 }),
    ]
    const result = buildDonutData(transactions, TransactionType.EXPENSE, categories)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ id: 1, name: 'Food', value: 80, color: '#ff0000' })
  })

  it('filters out non-matching transaction types', () => {
    const transactions = [makeTx({ type: TransactionType.INCOME, categoryId: 2, amount: 200 })]
    const result = buildDonutData(transactions, TransactionType.EXPENSE, categories)
    expect(result).toHaveLength(0)
  })

  it('uses "Без категории" when categoryId is null', () => {
    const transactions = [makeTx({ categoryId: null, amount: 100 })]
    const result = buildDonutData(transactions, TransactionType.EXPENSE, categories)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Без категории')
    expect(result[0].color).toBe('#cccccc')
  })

  it('uses "Без категории" when categoryId does not exist in the map', () => {
    const transactions = [makeTx({ categoryId: 999, amount: 100 })]
    const result = buildDonutData(transactions, TransactionType.EXPENSE, categories)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Без категории')
  })

  it('falls back to gray when category has no valid hex color', () => {
    const catWithBadColor: ICategory[] = [
      { id: 1, name: 'Food', color: '', currencyCode: 'RUB', isExpense: true, icon: 'Circle', isArchived: false },
    ]
    const transactions = [makeTx({ categoryId: 1, amount: 50 })]
    const result = buildDonutData(transactions, TransactionType.EXPENSE, catWithBadColor)
    expect(result[0].color).toBe('#cccccc')
  })

  it('aggregates INCOME transactions separately', () => {
    const transactions = [
      makeTx({ id: 1, type: TransactionType.INCOME, categoryId: 2, amount: 300 }),
      makeTx({ id: 2, type: TransactionType.INCOME, categoryId: 2, amount: 200 }),
    ]
    const result = buildDonutData(transactions, TransactionType.INCOME, categories)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ id: 2, name: 'Salary', value: 500, color: '#00ff00' })
  })

  it('handles empty transactions array', () => {
    const result = buildDonutData([], TransactionType.EXPENSE, categories)
    expect(result).toEqual([])
  })

  it('handles multiple different categories', () => {
    const transactions = [
      makeTx({ id: 1, categoryId: 1, amount: 10 }),
      makeTx({ id: 2, categoryId: 2, amount: 20, type: TransactionType.INCOME }),
      makeTx({ id: 3, categoryId: 2, amount: 30, type: TransactionType.INCOME }),
    ]
    const result = buildDonutData(transactions, TransactionType.INCOME, categories)
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe(50)
  })
})
