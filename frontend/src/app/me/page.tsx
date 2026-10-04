'use client'

import { useEffect, useMemo, useState } from 'react'

import { CategoriesPanel } from '@/components/dashboard/categories/categories-panel'
import { useDashboard } from '@/components/dashboard/dashboard-provider'
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

  const { data: modalTransactions = [] } = useTransactionsForPeriod(
    modalRange.from,
    modalRange.to,
    isTransactionListOpen
  )

  return (
    <div className="flex grow flex-col">
      <div className="flex grow flex-col gap-8 xl:flex-row xl:gap-8">
        <div className="flex grow min-w-0 flex-col rounded-2xl border bg-card/50 p-6 lg:p-10">
          <TransactionsDonutChart
            donutData={donutData}
            isExpense={isExpense}
            isLoading={isLoading}
            range={{ from: new Date(from), to: new Date(to) }}
            total={total}
            onRangeChange={range => setRange(range.from, range.to)}
          />
        </div>

        <div className="flex w-full shrink-0 flex-col xl:w-115">
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
