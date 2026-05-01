'use client'

import { buildDonutData } from '@/lib/transactions-donut'
import { endOfMonth, startOfMonth } from 'date-fns'
import { MessageSquare } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { CategoriesPanel } from '@/components/dashboard/categories/CategoriesPanel'
import { TransactionsDonutChart } from '@/components/dashboard/transactions/TransactionsDonutChart'
import { TransactionsListModal } from '@/components/dashboard/transactions/TransactionsListModal'

import { Button } from '@/components/ui/shadui/button'

import { TransactionType } from '@/types/transaction.types'

import { useCategories } from '@/hooks/useCategories'
import { useTransactionsForPeriod } from '@/hooks/useTransactions'
import ChatModal from '@/components/dashboard/chat/ChatModal'

const getCurrentMonthRange = () => ({
  from: startOfMonth(new Date()),
  to: endOfMonth(new Date())
})

export default function DashboardPage() {
  const [isExpense, setIsExpense] = useState(true)

  const [chartRange, setChartRange] = useState(getCurrentMonthRange())
  const [modalRange, setModalRange] = useState(getCurrentMonthRange())

  const [showTxList, setShowTxList] = useState(false)
  const [showChat, setShowChat] = useState(false) // ← новое состояние

  const { data: chartTransactions = [], isLoading: chartLoading } =
    useTransactionsForPeriod(chartRange.from, chartRange.to)

  const { data: modalTransactions = [], isLoading: modalLoading } =
    useTransactionsForPeriod(modalRange.from, modalRange.to)

  const { categories, isLoading: catLoading } = useCategories(isExpense)

  const loading = chartLoading || catLoading
  const type = isExpense ? TransactionType.EXPENSE : TransactionType.INCOME

  useEffect(() => {
    const open = () => setShowTxList(true)
    window.addEventListener('open-transactions', open)
    return () => window.removeEventListener('open-transactions', open)
  }, [])

  const donutData = useMemo(() => {
    return buildDonutData(chartTransactions, type, categories)
  }, [chartTransactions, type, categories])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        <div className="flex-1 min-w-0 rounded-2xl border bg-card/50 backdrop-blur-sm p-6 lg:p-10">
          <TransactionsDonutChart
            donutData={donutData}
            total={donutData.reduce((s, i) => s + i.value, 0)}
            isExpense={isExpense}
            range={chartRange}
            onRangeChange={setChartRange}
            loading={loading}
          />
        </div>

        <div className="w-full lg:w-[460px] shrink-0 space-y-4">
          <CategoriesPanel
            isExpense={isExpense}
            onExpenseChange={setIsExpense}
            donutData={donutData}
            loading={loading}
          />

          {/* Кнопка открытия чата */}
          <Button
            variant="outline"
            className="w-full h-14 text-base font-medium border-border/50 bg-card/30 backdrop-blur-sm hover:bg-accent/10 hover:border-accent/30 transition-all duration-300 group"
            onClick={() => setShowChat(true)} // ← добавили onClick
          >
            <MessageSquare className="size-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
            Спросить у помощника
          </Button>
        </div>
      </div>

      <TransactionsListModal
        transactions={modalTransactions}
        categories={categories}
        range={modalRange}
        onRangeChange={setModalRange}
        open={showTxList}
        onClose={() => setShowTxList(false)}
      />

      {/* Чат-модалка */}
      <ChatModal
        open={showChat}
        onClose={() => setShowChat(false)}
      />
    </div>
  )
}
