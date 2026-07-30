import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAccounts } from './use-accounts'
import { accountService } from '@/services/account.service'
import React from 'react'

vi.mock('@/services/account.service', () => ({
  accountService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
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

describe('useAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array before data loads', () => {
    vi.mocked(accountService.getAll).mockResolvedValueOnce([])
    const { result } = renderHook(() => useAccounts(), { wrapper: createWrapper() })
    expect(result.current.accounts).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it('returns accounts with currentBalance normalised to number', async () => {
    const accounts = [
      { id: 1, name: 'Wallet', currentBalance: '1500.50', currencyCode: 'RUB', createdAt: '', updatedAt: '', isDeleted: false, currencySymbol: '₽' },
    ]
    vi.mocked(accountService.getAll).mockResolvedValueOnce(accounts as any)

    const { result } = renderHook(() => useAccounts(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.accounts).toHaveLength(1)
    expect(result.current.accounts[0].currentBalance).toBe(1500.50)
  })

  it('createAccount calls service and invalidates dashboard', async () => {
    vi.mocked(accountService.getAll).mockResolvedValueOnce([])
    vi.mocked(accountService.create).mockResolvedValueOnce({ id: 1, name: 'New', currentBalance: 0 } as any)

    const { result } = renderHook(() => useAccounts(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.createAccount({ name: 'New', currencyCode: 'RUB', balance: 0 } as any)

    expect(accountService.create).toHaveBeenCalledWith({ name: 'New', currencyCode: 'RUB', balance: 0 })
  })

  it('updateAccount calls service with correct params', async () => {
    vi.mocked(accountService.getAll).mockResolvedValueOnce([{ id: 1, name: 'Old', currentBalance: 100, currencyCode: 'RUB' }] as any)
    vi.mocked(accountService.update).mockResolvedValueOnce({ id: 1, name: 'Updated', currentBalance: 200 } as any)

    const { result } = renderHook(() => useAccounts(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.updateAccount({ id: 1, data: { name: 'Updated' } as any })

    expect(accountService.update).toHaveBeenCalledWith(1, { name: 'Updated' })
  })

  it('deleteAccount calls service with id', async () => {
    vi.mocked(accountService.getAll).mockResolvedValueOnce([{ id: 1, name: 'ToDelete', currentBalance: 0 }] as any)
    vi.mocked(accountService.delete).mockResolvedValueOnce({ message: 'ok' })

    const { result } = renderHook(() => useAccounts(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.deleteAccount(1)

    expect(accountService.delete).toHaveBeenCalledWith(1)
  })
})
