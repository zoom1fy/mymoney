import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTransactionsForPeriod, useTransactionSummary, useTransactions } from './use-transactions'
import { transactionService } from '@/services/transaction.service'
import { TransactionType } from '@/types/transaction.type'
import React from 'react'

vi.mock('@/services/transaction.service', () => ({
  transactionService: {
    getAll: vi.fn(),
    getForPeriod: vi.fn(),
    getSummary: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useTransactionsForPeriod', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('fetches transactions for a date range', async () => {
    const from = new Date('2024-01-01')
    const to = new Date('2024-01-31')
    const txs = [{ id: 1, amount: 100, type: TransactionType.INCOME }]
    vi.mocked(transactionService.getForPeriod).mockResolvedValueOnce(txs as any)

    const { result } = renderHook(() => useTransactionsForPeriod(from, to), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(txs)
  })
})

describe('useTransactionSummary', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('fetches summary by type', async () => {
    const from = new Date('2024-01-01')
    const to = new Date('2024-01-31')
    const summary = [{ id: 1, name: 'Food', value: 500, color: '#ff0000' }]
    vi.mocked(transactionService.getSummary).mockResolvedValueOnce(summary as any)

    const { result } = renderHook(() => useTransactionSummary(from, to, TransactionType.EXPENSE), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(summary)
  })
})

describe('useTransactions', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns empty transactions before data loads', () => {
    vi.mocked(transactionService.getAll).mockResolvedValueOnce({ data: [], nextCursor: null } as any)
    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper() })
    expect(result.current.transactions).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it('fetches initial page of transactions', async () => {
    const pageData = {
      data: [{ id: 1, amount: 100, type: TransactionType.INCOME }],
      nextCursor: null,
    }
    vi.mocked(transactionService.getAll).mockResolvedValueOnce(pageData as any)

    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.transactions).toHaveLength(1)
  })

  it('createTransaction calls service', async () => {
    vi.mocked(transactionService.getAll).mockResolvedValueOnce({ data: [], nextCursor: null } as any)
    vi.mocked(transactionService.create).mockResolvedValueOnce({ id: 1 } as any)

    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const txData = { amount: 100, type: TransactionType.INCOME, accountId: 1 } as any
    await result.current.createTransaction(txData)

    expect(transactionService.create).toHaveBeenCalledWith(txData)
  })

  it('updateTransaction calls service with correct params', async () => {
    vi.mocked(transactionService.getAll).mockResolvedValueOnce({ data: [{ id: 1, amount: 50 }], nextCursor: null } as any)
    vi.mocked(transactionService.update).mockResolvedValueOnce({ id: 1, amount: 100 } as any)

    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.updateTransaction({ id: 1, data: { amount: 100 } as any })

    expect(transactionService.update).toHaveBeenCalledWith(1, { amount: 100 })
  })

  it('deleteTransaction calls service', async () => {
    vi.mocked(transactionService.getAll).mockResolvedValueOnce({ data: [{ id: 1, amount: 50, type: TransactionType.INCOME, accountId: 1 }], nextCursor: null } as any)
    vi.mocked(transactionService.delete).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.deleteTransaction(1)

    expect(transactionService.delete).toHaveBeenCalledWith(1)
  })
})
