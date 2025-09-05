'use client'

import styles from './Chart.module.scss'
import { categoryService } from '@/services/category.service'
import { transactionService } from '@/services/transaction.services'
import { ArcElement, Chart as ChartJS, Tooltip } from 'chart.js'
import { useEffect, useState } from 'react'
import { Doughnut } from 'react-chartjs-2'

import { Toggle } from '@/components/ui/buttons/toggle/Toggle'
import { CategoryBadge } from '@/components/ui/category/CategoryBadge'

import { ICategory } from '@/types/category.types'
import { ITransaction, TransactionType } from '@/types/transaction.types'

ChartJS.register(ArcElement, Tooltip)

interface IChartData {
  labels: string[]
  datasets: {
    data: number[]
    backgroundColor: string[]
  }[]
}

const COLORS = [
  '#4ADE80', // зелёный (доходы)
  '#F87171', // красный (расходы)
  '#60A5FA', // синий
  '#FACC15', // жёлтый
  '#A78BFA', // фиолет
  '#34D399', // бирюза
  '#FB923C' // оранжевый
]

export function Chart() {
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [categories, setCategories] = useState<ICategory[]>([])
  const [chartData, setChartData] = useState<IChartData>({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: []
      }
    ]
  })
  const [transactionType, setTransactionType] = useState<
    TransactionType.INCOME | TransactionType.EXPENSE
  >(TransactionType.EXPENSE)

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

  useEffect(() => {
    // Filter categories by transaction type using isExpense (1 for EXPENSE, 0 for INCOME)
    const filteredCategories = categories.filter(
      c =>
        c.isExpense ===
        (transactionType === TransactionType.EXPENSE ? true : false)
    )
    const grouped: Record<string, number> = {}

    // Initialize all filtered categories with 0
    filteredCategories.forEach(category => {
      grouped[category.name] = 0
    })

    // Sum transactions for each category
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

    const labels = filteredCategories.map(c => c.name)
    const values = filteredCategories.map(c => grouped[c.name] || 0)

    setChartData({
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: labels.map(
            (_, index) => COLORS[index % COLORS.length]
          )
        }
      ]
    })
  }, [transactions, transactionType, categories])

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
          <Doughnut
            data={chartData}
            options={{
              cutout: '80%',
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: 'rgba(30,30,30,0.9)',
                  padding: 12,
                  cornerRadius: 6, // Скругление углов
                  titleFont: { size: 14, weight: 'bold' },
                  bodyFont: { size: 13 },
                  callbacks: {
                    label: function (context) {
                      const value = context.raw as number
                      return `${context.label}: ${value.toLocaleString()} ₽`
                    }
                  }
                }
              }
            }}
          />
        </div>
        <div className={styles.legendContainer}>
          {chartData.labels.map((label, index) => {
            const category = categories.find(c => c.name === label)
            if (!category) return null
            return (
              <CategoryBadge
                key={label}
                category={category}
                color={chartData.datasets[0].backgroundColor[index]}
                value={chartData.datasets[0].data[index]}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
