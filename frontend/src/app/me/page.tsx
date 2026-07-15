'use client'

import { endOfMonth, startOfMonth } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'

import { CategoriesPanel } from '@/components/dashboard/categories/categories-panel'

import { TransactionsDonutChart } from '@/components/dashboard/transactions/transactions-donut-chart'
import { TransactionsListModal } from '@/components/dashboard/transactions/transactions-list-modal'

import { TransactionType } from '@/types/transaction.type'

import { useCategories } from '@/hooks/use-categories'
import { useTransactionSummary, useTransactionsForPeriod } from '@/hooks/use-transactions'

const getCurrentMonthRange = () => ({
  from: startOfMonth(new Date()),
  to: endOfMonth(new Date())
})

export default function DashboardPage() {
  const [isExpense, setIsExpense] = useState(true)

  const [chartRange, setChartRange] = useState(getCurrentMonthRange())
  const [modalRange, setModalRange] = useState(getCurrentMonthRange())
  const [isTransactionListOpen, setIsTransactionListOpen] = useState(false)

  const type = isExpense ? TransactionType.EXPENSE : TransactionType.INCOME

  const { data: chartData, isLoading: chartLoading } =
    useTransactionSummary(chartRange.from, chartRange.to, type)

  const { data: modalTransactions = [], isLoading: _modalLoading } =
    useTransactionsForPeriod(modalRange.from, modalRange.to)

  const {
    categories, isLoading: catLoading
  } = useCategories(isExpense)

  const isLoading = chartLoading || catLoading
  // Header fires 'open-transactions' to open the transaction list from anywhere
  useEffect(() => {
    const handleOpenTx = () => setIsTransactionListOpen(true)
    window.addEventListener('open-transactions', handleOpenTx)

    return () => {
      window.removeEventListener('open-transactions', handleOpenTx)
    }
  }, [])

  const donutData = chartData ?? []
  const total = useMemo(
    () => donutData.reduce((sum, item) => sum + item.value, 0),
    [donutData]
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        <div className="flex-1 min-w-0 rounded-2xl border bg-card/50 backdrop-blur-sm p-6 lg:p-10">
          <TransactionsDonutChart
            donutData={donutData}
            isExpense={isExpense}
            isLoading={isLoading}
            range={chartRange}
            total={total}
            onRangeChange={setChartRange}
          />
        </div>

        <div className="w-full lg:w-[460px] shrink-0 space-y-4">
          <CategoriesPanel
            categories={categories}
            donutData={donutData}
            isExpense={isExpense}
            isLoading={isLoading}
            onExpenseChange={setIsExpense}
          />
        </div>
      </div>

      <TransactionsListModal
        categories={categories}
        isOpen={isTransactionListOpen}
        range={modalRange}
        transactions={modalTransactions}
        onClose={() => setIsTransactionListOpen(false)}
        onRangeChange={setModalRange}
      />

    </div>
  )
}
