'use client'

import { TransactionItem } from './TransactionListItem'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import debounce from 'lodash/debounce'
import { CalendarDays, ChevronDown, Filter, Search, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { DateRangePicker } from '@/components/dashboard/transactions/DateRangePicker'
import { GlassCard } from '@/components/ui/cards/glass-card'
import { Button } from '@/components/ui/shadui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/shadui/dialog'
import { Input } from '@/components/ui/shadui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadui/select'

import { ICategory } from '@/types/category.types'
import { ITransaction, TransactionType } from '@/types/transaction.types'

interface Props {
  transactions: ITransaction[]
  categories: ICategory[]
  open: boolean
  onClose: () => void
  pageSize?: number
}

export function TransactionsListModal({
  transactions,
  categories,
  open,
  onClose,
  pageSize = 20
}: Props) {
  const [search, setSearch] = useState('') // мгновенное, для value input
  const [debouncedSearch, setDebouncedSearch] = useState('') // для фильтрации

  const updateDebounced = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value)
        setCurrentPage(1) // сброс страницы при новом поиске — удобно
      }, 350),
    []
  )

  useEffect(() => {
    return () => {
      updateDebounced.cancel()
    }
  }, [updateDebounced])

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>(
    'all'
  )
  const [filterCategory, setFilterCategory] = useState<number | 'all'>('all')
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Фильтрация
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const category = categories.find(c => c.id === tx.categoryId)

      // Поиск
      const matchesSearch = debouncedSearch
        ? tx.description
            ?.toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          category?.name.toLowerCase().includes(debouncedSearch.toLowerCase())
        : true

      // По типу
      const matchesType =
        filterType === 'all'
          ? true
          : filterType === 'income'
            ? tx.type === TransactionType.INCOME
            : tx.type === TransactionType.EXPENSE

      // По категории
      const matchesCategory =
        filterCategory === 'all' ? true : tx.categoryId === filterCategory

      // По дате
      const txDate = new Date(tx.transactionDate)
      const matchesDate = txDate >= dateRange.from && txDate <= dateRange.to

      return matchesSearch && matchesType && matchesCategory && matchesDate
    })
  }, [
    transactions,
    categories,
    debouncedSearch,
    filterType,
    filterCategory,
    dateRange
  ])

  // Пагинация
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
    >
      <DialogContent className="w-[95vw] max-w-5xl xl:max-w-6xl p-0 max-h-[90vh] overflow-y-auto">
        <GlassCard className="rounded-3xl p-4 sm:p-6 md:p-10 lg:p-14 shadow-2xl transition-all duration-500">
          <DialogHeader className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <DialogTitle className="text-xl sm:text-2xl font-bold">
                Список транзакций
              </DialogTitle>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMobileFilters(prev => !prev)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Фильтры
                  <motion.div
                    layout
                    animate={{ rotate: showMobileFilters ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Поиск для мобильных и десктоп */}
          <div className="">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по описанию или категории"
                value={search}
                onChange={e => {
                  const val = e.target.value
                  setSearch(val) // мгновенно → input отзывчивый
                  updateDebounced(val.trim()) // тяжёлая работа с задержкой
                }}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Фильтры - адаптивная версия */}
          <AnimatePresence initial={false}>
            {showMobileFilters && (
              <motion.div
                key="filters"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }}
                className="overflow-hidden"
              >
                <div className="">
                  {/* Первая строка: Тип и Категория */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Тип транзакции */}
                    <div className="">
                      <label className="text-sm font-medium">Тип</label>
                      <Select
                        value={filterType}
                        onValueChange={v => {
                          setFilterType(v as any)
                          setCurrentPage(1)
                        }}
                      >
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          <SelectItem value="all">Все транзакции</SelectItem>
                          <SelectItem value="income">Только доходы</SelectItem>
                          <SelectItem value="expense">
                            Только расходы
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Категория */}
                    <div className="">
                      <label className="text-sm font-medium">Категория</label>
                      <Select
                        value={filterCategory.toString()}
                        onValueChange={v => {
                          setFilterCategory(v === 'all' ? 'all' : Number(v))
                          setCurrentPage(1)
                        }}
                      >
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                        <SelectContent className="bg-background max-h-[200px]">
                          <SelectItem value="all">Все категории</SelectItem>
                          {categories.map(c => (
                            <SelectItem
                              key={c.id}
                              value={c.id.toString()}
                            >
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Вторая строка: Период */}
                  <div className="grid grid-cols-1 sm:grid-cols-1 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Период
                      </label>
                      <DateRangePicker
                        value={dateRange}
                        onChange={range => {
                          setDateRange(range)
                          setCurrentPage(1)
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Заголовок таблицы для десктопа */}
          <div className="hidden sm:grid grid-cols-12 gap-4 mb-4 px-4 text-sm text-muted-foreground">
            <div className="col-span-5">Описание / Категория</div>
            <div className="col-span-3">Дата</div>
            <div className="col-span-4 text-right">Сумма</div>
          </div>

          {/* Список транзакций */}
          <div className="max-h-[40vh] sm:max-h-[40vh] overflow-y-auto rounded-lg border bg-card">
            {paginatedTransactions.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                Транзакции не найдены
              </div>
            ) : (
              <div className="divide-y divide-border">
                {paginatedTransactions.map(tx => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    category={categories.find(c => c.id === tx.categoryId)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="mt-6">
              {/* Информация о странице */}
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Показано {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, filtered.length)} из{' '}
                  {filtered.length}
                </p>
              </div>

              {/* Кнопки пагинации */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
                <div className="flex flex-wrap justify-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    // Логика для умного отображения страниц
                    let pageNum
                    if (totalPages <= 7) {
                      pageNum = i + 1
                    } else if (currentPage <= 4) {
                      pageNum = i + 1
                      if (i === 6) pageNum = totalPages
                    } else if (currentPage >= totalPages - 3) {
                      if (i === 0) pageNum = 1
                      else pageNum = totalPages - 6 + i
                    } else {
                      if (i === 0) pageNum = 1
                      else if (i === 6) pageNum = totalPages
                      else pageNum = currentPage - 3 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={
                          currentPage === pageNum ? 'default' : 'outline'
                        }
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </DialogContent>
    </Dialog>
  )
}
