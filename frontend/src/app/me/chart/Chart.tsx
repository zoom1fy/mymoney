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

  const chartData = useMemo(() => {
    const filteredCategories = categories.filter(
      c => c.isExpense === (transactionType === TransactionType.EXPENSE)
    )
    const grouped: Record<string, number> = {}
    filteredCategories.forEach(c => (grouped[c.name] = 0))

    transactions
      .filter(t => t.type === transactionType)
      .forEach(t => {
        const category = filteredCategories.find(c => c.id === t.categoryId)
        if (category) grouped[category.name] += Number(t.amount) || 0
      })

    return filteredCategories.map((c, i) => ({
      name: c.name,
      value: grouped[c.name] || 0,
      color: COLORS[i % COLORS.length],
      category: c
    }))
  }, [transactions, categories, transactionType])

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
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.color}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'transparent' }}
                content={({ payload }) => {
                  if (!payload?.[0]) return null
                  const { name, value } = payload[0].payload
                  return (
                    <div className={styles.tooltip}>
                      <strong>{name}</strong>: {value.toLocaleString()} ₽
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">
              {total.toLocaleString()} ₽
            </span>
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
              key={item.name}
              onClick={() => handleCategoryClick(item.category)}
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
