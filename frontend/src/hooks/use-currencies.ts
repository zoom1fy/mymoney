'use client'

import { useQuery } from '@tanstack/react-query'

import { currencyService } from '@/services/currency.service'
import { CurrencyType } from '@/types/account.type'

// Currencies are static data that only changes via migration, so cache them indefinitely.
export function useCurrencies() {
  const { data: currencies = [], isLoading } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => currencyService.getAll(),
    staleTime: Infinity,
  })

  const currencyLabelMap: Record<string, string> = Object.fromEntries(
    currencies.map(c => [c.code, `${c.symbol} ${c.name}`])
  )

  const currencySymbolMap: Record<string, string> = Object.fromEntries(
    currencies.map(c => [c.code, c.symbol])
  )

  const currencyTypeMap: Record<string, CurrencyType> = Object.fromEntries(
    currencies.map(c => [c.code, c.type as CurrencyType])
  )

  return { currencies, currencyLabelMap, currencySymbolMap, currencyTypeMap, isLoading }
}
