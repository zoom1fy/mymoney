'use client'

import { useMemo } from 'react'
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

  // Maps are derived once per fetch — rebuilding them on every render is wasteful
  const currencyLabelMap = useMemo(
    () =>
      Object.fromEntries(currencies.map(c => [c.code, `${c.symbol} ${c.name}`])),
    [currencies]
  )

  const currencySymbolMap = useMemo(
    () => Object.fromEntries(currencies.map(c => [c.code, c.symbol])),
    [currencies]
  )

  const currencyTypeMap = useMemo(
    () => Object.fromEntries(currencies.map(c => [c.code, c.type as CurrencyType])),
    [currencies]
  )

  return { currencies, currencyLabelMap, currencySymbolMap, currencyTypeMap, isLoading }
}
