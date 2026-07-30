import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCurrencies } from './use-currencies'
import { currencyService } from '@/services/currency.service'
import React from 'react'

vi.mock('@/services/currency.service', () => ({
  currencyService: {
    getAll: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useCurrencies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty arrays before data loads', () => {
    vi.mocked(currencyService.getAll).mockResolvedValueOnce([])
    const { result } = renderHook(() => useCurrencies(), { wrapper: createWrapper() })
    expect(result.current.currencies).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it('returns currencies and builds lookup maps after fetch', async () => {
    const currencies = [
      { code: 'RUB', name: 'Российский рубль', symbol: '₽', type: 'FIAT' as const },
      { code: 'BTC', name: 'Bitcoin', symbol: '₿', type: 'CRYPTO' as const },
    ]
    vi.mocked(currencyService.getAll).mockResolvedValueOnce(currencies)

    const { result } = renderHook(() => useCurrencies(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.currencies).toEqual(currencies)
    expect(result.current.currencyLabelMap).toEqual({
      RUB: '₽ Российский рубль',
      BTC: '₿ Bitcoin',
    })
    expect(result.current.currencySymbolMap).toEqual({
      RUB: '₽',
      BTC: '₿',
    })
    expect(result.current.currencyTypeMap).toEqual({
      RUB: 'FIAT',
      BTC: 'CRYPTO',
    })
  })

  it('defaults to empty array on error', async () => {
    vi.mocked(currencyService.getAll).mockRejectedValueOnce(new Error('API error'))

    const { result } = renderHook(() => useCurrencies(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.currencies).toEqual([])
  })
})
