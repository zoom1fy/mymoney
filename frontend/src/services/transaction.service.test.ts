import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TransactionType } from '@/types/transaction.type'

const { mockGet, mockPost, mockPatch, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('../api/interceptor', () => ({
  axiosWithAuth: {
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete,
  },
}))

describe('transactionService', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    mockPatch.mockReset()
    mockDelete.mockReset()
  })

  it('create posts to /transactions', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 1, amount: '100', type: 'INCOME' } })
    const { transactionService } = await import('./transaction.service')
    const result = await transactionService.create({ amount: 100, type: TransactionType.INCOME } as any)
    expect(mockPost).toHaveBeenCalledWith('/transactions', { amount: 100, type: TransactionType.INCOME })
    expect(result).toEqual({ id: 1, amount: '100', type: 'INCOME' })
  })

  it('getAll fetches from /transactions with cursor and maps types', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 1, amount: '100', type: 'INCOME' }], nextCursor: null } })
    const { transactionService } = await import('./transaction.service')
    const result = await transactionService.getAll(undefined)
    expect(mockGet).toHaveBeenCalledWith('/transactions', { params: { take: 20, cursor: undefined, from: undefined, to: undefined } })
    expect(result.data).toHaveLength(1)
    expect(result.data[0].amount).toBe(100)
    expect(result.data[0].type).toBe(TransactionType.INCOME)
  })

  it('getForPeriod fetches with date params', async () => {
    const from = new Date('2024-01-01')
    const to = new Date('2024-01-31')
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 1, amount: '50', type: 'EXPENSE' }] } })
    const { transactionService } = await import('./transaction.service')
    const result = await transactionService.getForPeriod(from, to)
    expect(mockGet).toHaveBeenCalledWith('/transactions', {
      params: { take: 1000, from: from.toISOString(), to: to.toISOString() },
    })
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe(TransactionType.EXPENSE)
  })

  it('getSummary fetches from /transactions/summary', async () => {
    const from = new Date('2024-01-01')
    const to = new Date('2024-01-31')
    mockGet.mockResolvedValueOnce({
      data: [{ categoryId: 1, categoryName: 'Food', categoryColor: '#ff0000', totalAmount: 500 }],
    })
    const { transactionService } = await import('./transaction.service')
    const result = await transactionService.getSummary(from, to, TransactionType.EXPENSE)
    expect(mockGet).toHaveBeenCalledWith('/transactions/summary', {
      params: { from: from.toISOString(), to: to.toISOString(), type: TransactionType.EXPENSE },
    })
    expect(result).toEqual([{ id: 1, name: 'Food', value: 500, color: '#ff0000' }])
  })

  it('getById fetches from /transactions/:id', async () => {
    mockGet.mockResolvedValueOnce({ data: { id: 5, amount: '200', type: 'TRANSFER' } })
    const { transactionService } = await import('./transaction.service')
    const result = await transactionService.getById(5)
    expect(mockGet).toHaveBeenCalledWith('/transactions/5')
    expect(result.amount).toBe(200)
    expect(result.type).toBe(TransactionType.TRANSFER)
  })

  it('update patches to /transactions/:id', async () => {
    mockPatch.mockResolvedValueOnce({ data: { id: 1, amount: '150', type: 'INCOME' } })
    const { transactionService } = await import('./transaction.service')
    const result = await transactionService.update(1, { amount: 150 } as any)
    expect(mockPatch).toHaveBeenCalledWith('/transactions/1', { amount: 150 })
    expect(result.amount).toBe(150)
    expect(result.type).toBe(TransactionType.INCOME)
  })

  it('delete sends DELETE to /transactions/:id', async () => {
    mockDelete.mockResolvedValueOnce({ data: undefined })
    const { transactionService } = await import('./transaction.service')
    const result = await transactionService.delete(1)
    expect(mockDelete).toHaveBeenCalledWith('/transactions/1')
    expect(result).toBeUndefined()
  })
})
