'use client'

import { useEffect, useMemo, useState } from 'react'

import { useDashboard } from '@/components/dashboard/dashboard-provider'
import { CategoriesPanel } from '@/components/dashboard/categories/categories-panel'

import { TransactionsDonutChart } from '@/components/dashboard/transactions/transactions-donut-chart'
import { TransactionsListModal } from '@/components/dashboard/transactions/transactions-list-modal'
import { useTransactionsForPeriod } from '@/hooks/use-transactions'

export default function DashboardPage() {
  const {
    donutData,
    total,
    isExpense,
    setIsExpense,
    from,
    to,
    setRange,
    categories: allCategories,
    isLoading
  } = useDashboard()

  const [isTransactionListOpen, setIsTransactionListOpen] = useState(false)
  const [modalRange, setModalRange] = useState({
    from: new Date(from),
    to: new Date(to)
  })

  useEffect(() => {
    const handleOpenTx = () => setIsTransactionListOpen(true)
    window.addEventListener('open-transactions', handleOpenTx)

    return () => {
      window.removeEventListener('open-transactions', handleOpenTx)
    }
  }, [])

  const categories = useMemo(
    () => allCategories.filter(c => c.isExpense === isExpense),
    [allCategories, isExpense]
  )

  const { data: modalTransactions = [] } =
    useTransactionsForPeriod(modalRange.from, modalRange.to, isTransactionListOpen)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        <div className="flex-1 min-w-0 rounded-2xl border bg-card/50 backdrop-blur-sm p-6 lg:p-10">
          <TransactionsDonutChart
            donutData={donutData}
            isExpense={isExpense}
            isLoading={isLoading}
            range={{ from: new Date(from), to: new Date(to) }}
            total={total}
            onRangeChange={(range) => setRange(range.from, range.to)}
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
        categories={allCategories}
        isOpen={isTransactionListOpen}
        range={modalRange}
        transactions={modalTransactions}
        onClose={() => setIsTransactionListOpen(false)}
        onRangeChange={setModalRange}
      />

    </div>
  )
}
