'use client'

import { buildDonutData } from '@/lib/transactions-donut'
import { endOfMonth, startOfMonth } from 'date-fns'
import { useMemo, useState } from 'react'

import { CategoriesPanel } from '@/components/dashboard/categories/CategoriesPanel'
import { TransactionsDonutChart } from '@/components/dashboard/transactions/TransactionsDonutChart'
import { TransactionsListModal } from '@/components/dashboard/transactions/TransactionsListModal'
import { Button } from '@/components/ui/shadui/button'

import { TransactionType } from '@/types/transaction.types'

import { useCategories } from '@/hooks/useCategories'
import { useTransactions } from '@/hooks/useTransactions'

export default function DashboardPage() {
  const [isExpense, setIsExpense] = useState(true)
  const [range, setRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [showTxList, setShowTxList] = useState(false)

  const { transactions, isLoading: txLoading } = useTransactions()
  const { categories, isLoading: catLoading } = useCategories(isExpense)

  const loading = txLoading || catLoading

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
          Обзор финансов
        </h1>
        <Button
          className="w-full cursor-pointer sm:w-auto"
          onClick={() => setShowTxList(true)}
        >
          Открыть список транзакций
        </Button>
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

        <div className="w-full lg:w-[460px] max-w-[460px]">
          <CategoriesPanel
            isExpense={isExpense}
            onExpenseChange={setIsExpense}
            donutData={donutData}
            loading={loading}
          />
        </div>
      </div>

      {/* Модалка */}
      <TransactionsListModal
        transactions={transactions}
        categories={categories}
        open={showTxList}
        onClose={() => setShowTxList(false)}
      />
    </div>
  )
}
