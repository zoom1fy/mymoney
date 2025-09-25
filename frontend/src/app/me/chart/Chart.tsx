'use client'

import styles from './Chart.module.scss'
import { CreateCategoryModal } from './categories/CreateCategoryModal'
import { TransactionModal } from './transaction/TransactionModal'
import { categoryService } from '@/services/category.service'
import { transactionService } from '@/services/transaction.services'
import { FC, useEffect, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { ButtonPlus } from '@/components/ui/buttons/ButtonPlus'
import { Toggle } from '@/components/ui/buttons/toggle/Toggle'
import { CategoryBadge } from '@/components/ui/category/CategoryBadge'

import { COLORS } from '@/constants/categories.color.constants'

import { ICategory } from '@/types/category.types'
import { ITransaction, TransactionType } from '@/types/transaction.types'

interface ChartProps {
  onTransactionSuccess?: () => void
}

// форматируем валюту
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(value)

function buildChartData(
  transactions: ITransaction[],
  categories: ICategory[],
  isExpense: boolean
) {
  const filteredCategories = categories.filter(c => c.isExpense === isExpense)
  const grouped: Record<number, number> = {}

  filteredCategories.forEach(c => (grouped[c.id] = 0))

  const categoryMap = new Map(filteredCategories.map(c => [c.id, c]))

  transactions.forEach(t => {
    if (t.categoryId !== undefined && grouped[t.categoryId] !== undefined) {
      grouped[t.categoryId] += Number(t.amount) || 0
    }
  })

  return filteredCategories.map((c, i) => ({
    name: c.name,
    value: grouped[c.id] || 0,
    color: COLORS[i % COLORS.length],
    category: categoryMap.get(c.id)!
  }))
}

export const Chart: FC<ChartProps> = ({ onTransactionSuccess }) => {
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [categories, setCategories] = useState<ICategory[]>([])
  const [transactionType, setTransactionType] = useState<TransactionType>(
    TransactionType.EXPENSE
  )
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(
    null
  )
  const [transactionMode, setTransactionMode] = useState<
    'transaction' | 'edit'
  >('transaction')
  const [modalCategoryOpen, setModalCategoryOpen] = useState(false)

  const loadData = async () => {
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        transactionService.getAll(),
        categoryService.getAll()
      ])
      setTransactions(transactionsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // мемоизация данных для графиков
  const expenseChartData = useMemo(
    () => buildChartData(transactions, categories, true),
    [transactions, categories]
  )
  const incomeChartData = useMemo(
    () => buildChartData(transactions, categories, false),
    [transactions, categories]
  )

  const chartData =
    transactionType === TransactionType.EXPENSE
      ? expenseChartData
      : incomeChartData

  const total = chartData.reduce((acc, item) => acc + item.value, 0)

  const handleCategoryCreated = (newCategory: ICategory) =>
    setCategories(prev => [...prev, newCategory])

  const handleCategoryClick = (category: ICategory) =>
    setSelectedCategory(category)

  const handleTransactionSubmit = () => {
    loadData()
    onTransactionSuccess?.()
    setSelectedCategory(null)
  }

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.chartHeader}>
        <Toggle
          leftText="Расходы"
          rightText="Доходы"
          isActive={transactionType === TransactionType.INCOME}
          onToggle={isActive =>
            setTransactionType(
              isActive ? TransactionType.INCOME : TransactionType.EXPENSE
            )
          }
        />
      </div>

      <div className={styles.chartContent}>
        <div className={styles.chartContainer}>
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={chartData}
                innerRadius="70%"
                outerRadius="100%"
                dataKey="value"
                paddingAngle={2}
                animationDuration={700}
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.color}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(0,0,0,0.7)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  border: 'none'
                }}
                itemStyle={{ color: '#fff' }}
                content={({ payload }) => {
                  if (!payload?.[0]) return null
                  const { name, value } = payload[0].payload
                  return (
                    <div className={styles.tooltip}>
                      <strong>{name}</strong>: {formatCurrency(value)}
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{formatCurrency(total)}</span>
            <span className="text-sm opacity-70">
              {transactionType === TransactionType.EXPENSE
                ? 'Расходы'
                : 'Доходы'}
            </span>
          </div>
        </div>

        <div className={styles.legendContainer}>
          {chartData.map(item => (
            <div
              key={item.category.id}
              onClick={() => handleCategoryClick(item.category)}
              className={`cursor-pointer ${
                selectedCategory?.id === item.category.id
                  ? 'font-bold opacity-100'
                  : 'opacity-80 hover:opacity-100'
              }`}
            >
              <CategoryBadge
                category={item.category}
                color={item.color}
                value={item.value}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.addCategoryWrapper}>
        <ButtonPlus
          size="small"
          variant="outline"
          iconPosition="left"
          onClick={() => setModalCategoryOpen(true)}
        >
          Добавить категорию
        </ButtonPlus>
      </div>

      <CreateCategoryModal
        isOpen={modalCategoryOpen}
        onClose={() => setModalCategoryOpen(false)}
        isExpense={transactionType === TransactionType.EXPENSE}
        onCategoryCreated={handleCategoryCreated}
      />

      {selectedCategory && (
        <TransactionModal
          isOpen={true}
          onClose={() => setSelectedCategory(null)}
          category={selectedCategory}
          onSubmit={handleTransactionSubmit}
          transactionMode={transactionMode}
          setTransactionMode={setTransactionMode}
        />
      )}
    </div>
  )
}
