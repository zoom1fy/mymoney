'use client'

import { buildDonutData } from '@/lib/transactions-donut'
import { Category } from '@/lib/transactions-donut'
import { categoryService } from '@/services/category.service'
import { transactionService } from '@/services/transaction.services'
import { endOfMonth, startOfMonth } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'

import { CategoriesPanel } from '@/components/dashboard/categories/CategoriesPanel'
import { TransactionsDonutChart } from '@/components/dashboard/transactions/TransactionsDonutChart'

import { ITransaction, TransactionType } from '@/types/transaction.types'

export default function DashboardPage() {
  const [isExpense, setIsExpense] = useState(true)
  const [range, setRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })

  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      transactionService.getAll().then(setTransactions),
      categoryService.getAll().then(setCategories)
    ]).finally(() => setLoading(false))
  }, [])

  const type = isExpense ? TransactionType.EXPENSE : TransactionType.INCOME

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.transactionDate)
      return date >= range.from && date <= range.to
    })
  }, [transactions, range.from, range.to])

  const donutData = useMemo(() => {
    return buildDonutData(filteredTransactions, type, categories)
  }, [filteredTransactions, type, categories])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Обзор финансов</h1>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        <div className="flex-1 rounded-2xl border bg-card/50 backdrop-blur-sm p-6 lg:p-10">
          <TransactionsDonutChart
            donutData={donutData}
            total={donutData.reduce((s, i) => s + i.value, 0)}
            isExpense={isExpense}
            range={range}
            onRangeChange={setRange}
            loading={loading}
          />
        </div>

        <div className="w-[360px] lg:w-[460px]">
          <CategoriesPanel
            isExpense={isExpense}
            onExpenseChange={setIsExpense}
            donutData={donutData}
          />
        </div>
      </div>
    </div>
  )
}
