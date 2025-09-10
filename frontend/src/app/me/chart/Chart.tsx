'use client'

import styles from './Chart.module.scss'
import { CreateCategoryModal } from './categories/CreateCategoryModal'
import { categoryService } from '@/services/category.service'
import { transactionService } from '@/services/transaction.services'
import { useEffect, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { ButtonPlus } from '@/components/ui/buttons/ButtonPlus'
import { Toggle } from '@/components/ui/buttons/toggle/Toggle'
import { CategoryBadge } from '@/components/ui/category/CategoryBadge'

import { ICategory } from '@/types/category.types'
import { ITransaction, TransactionType } from '@/types/transaction.types'

const COLORS = [
  '#4ADE80',
  '#F87171',
  '#60A5FA',
  '#FACC15',
  '#A78BFA',
  '#34D399',
  '#FB923C'
]

export function Chart() {
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [categories, setCategories] = useState<ICategory[]>([])
  const [transactionType, setTransactionType] = useState<
    TransactionType.INCOME | TransactionType.EXPENSE
  >(TransactionType.EXPENSE)

  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const transactionsData = await transactionService.getAll()
        setTransactions(transactionsData)

        const categoriesData = await categoryService.getAll()
        setCategories(categoriesData)
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      }
    }
    loadData()
  }, [])

  const chartData = useMemo(() => {
    const filteredCategories = categories.filter(
      c => c.isExpense === (transactionType === TransactionType.EXPENSE)
    )

    const grouped: Record<string, number> = {}
    filteredCategories.forEach(category => {
      grouped[category.name] = 0
    })

    const filteredTransactions = transactions.filter(
      t => t.type === transactionType
    )
    filteredTransactions.forEach(t => {
      const category = filteredCategories.find(c => c.id === t.categoryId)
      const categoryName = category?.name || 'Без категории'
      const amount = Number(t.amount) || 0
      if (category && categoryName !== 'Без категории') {
        grouped[categoryName] = (grouped[categoryName] || 0) + amount
      }
    })

    return filteredCategories.map((c, index) => ({
      name: c.name,
      value: grouped[c.name] || 0,
      color: COLORS[index % COLORS.length],
      category: c
    }))
  }, [transactions, transactionType, categories])

  const total = chartData.reduce((acc, item) => acc + item.value, 0)

  const handleCategoryCreated = (newCategory: ICategory) => {
    setCategories(prev => [...prev, newCategory])
  }

  return (
    <div className={styles.chartWrapper}>
      {/* Переключатель */}
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

      {/* Контент: диаграмма + легенда */}
      <div className={styles.chartContent}>
        {/* Диаграмма */}
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
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'transparent' }}
                content={({ payload }) => {
                  if (!payload || !payload[0]) return null
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

          {/* Центр доната */}
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

        {/* Легенда справа */}
        <div className={styles.legendContainer}>
          {chartData.map(item => (
            <CategoryBadge
              key={item.name}
              category={item.category}
              color={item.color}
              value={item.value}
            />
          ))}
        </div>
      </div>

      {/* Кнопка создания категории под диаграммой и карточками */}
      <div className={styles.addCategoryWrapper}>
        <ButtonPlus
          size="small"
          variant="outline"
          iconPosition="left"
          onClick={() => setIsModalOpen(true)}
        >
          Добавить категорию
        </ButtonPlus>
      </div>

      {/* Модалка */}
      <CreateCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isExpense={transactionType === TransactionType.EXPENSE}
        onCategoryCreated={handleCategoryCreated}
      />
    </div>
  )
}
