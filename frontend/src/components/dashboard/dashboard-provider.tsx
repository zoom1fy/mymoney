'use client'

import { endOfMonth, startOfMonth } from 'date-fns'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { dashboardService } from '@/services/dashboard.service'
import { syncRatesIfNeeded } from '@/services/local/rates.service'
import { DonutItem } from '@/lib/transactions-donut'
import { IAccount } from '@/types/account.type'
import { ICategory } from '@/types/category.type'
import { IUser } from '@/types/auth.type'
import { TransactionType } from '@/types/transaction.type'

interface DashboardContextValue {
  profile: IUser | undefined
  accounts: IAccount[]
  categories: ICategory[]
  archivedCategories: ICategory[]
  donutData: DonutItem[]
  total: number
  isExpense: boolean
  setIsExpense: (v: boolean) => void
  from: string
  to: string
  setRange: (from: Date, to: Date) => void
  isLoading: boolean
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined)

function mapSummary(
  items: { categoryId: number | null; categoryName: string | null; categoryColor: string | null; totalAmount: number }[]
): DonutItem[] {
  return items.map(item => ({
    id: item.categoryId ?? 0,
    name: item.categoryName ?? 'Без категории',
    value: item.totalAmount,
    color: item.categoryColor && item.categoryColor.startsWith('#') ? item.categoryColor : '#cccccc'
  }))
}

export function DashboardProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const [isExpense, setIsExpense] = useState(true)
  const [from, setFrom] = useState(startOfMonth(new Date()).toISOString())
  const [to, setTo] = useState(endOfMonth(new Date()).toISOString())

  // Daily exchange-rate sync (desktop): refreshes when older than a day and
  // re-reads the summary so totals reflect the new rates
  useEffect(() => {
    let cancelled = false

    void syncRatesIfNeeded().then(updated => {
      if (updated > 0 && !cancelled) {
        void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
    })

    return () => {
      cancelled = true
    }
  }, [queryClient])

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', from, to],
    queryFn: () => dashboardService.getDashboard(from, to),
    staleTime: 1000 * 60
  })

  const setRange = (fromDate: Date, toDate: Date) => {
    setFrom(fromDate.toISOString())
    setTo(toDate.toISOString())
  }

  const type = isExpense ? TransactionType.EXPENSE : TransactionType.INCOME
  const rawSummary = type === TransactionType.EXPENSE ? data?.expenseSummary : data?.incomeSummary

  const donutData = useMemo(() => (rawSummary ? mapSummary(rawSummary) : []), [rawSummary])
  const total = useMemo(() => donutData.reduce((sum, item) => sum + item.value, 0), [donutData])

  const value: DashboardContextValue = {
    profile: data?.profile,
    accounts: data?.accounts ?? [],
    categories: data?.categories ?? [],
    archivedCategories: data?.archivedCategories ?? [],
    donutData,
    total,
    isExpense,
    setIsExpense,
    from,
    to,
    setRange,
    isLoading
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}
