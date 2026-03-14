'use client'

import { TransactionFilters } from './TransactionFilters'
import { TransactionItem } from './TransactionListItem'
import { AnimatePresence, motion } from 'framer-motion'
import debounce from 'lodash/debounce'
import { ChevronDown, Filter, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { GlassCard } from '@/components/ui/cards/glass-card'
import { Button } from '@/components/ui/shadui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/shadui/dialog'
import { Input } from '@/components/ui/shadui/input'

// Импорт нового компонента

import { ICategory } from '@/types/category.types'
import { ITransaction, TransactionType } from '@/types/transaction.types'

const getCurrentMonthRange = () => {
  const now = new Date()
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  }
}

interface Props {
  transactions: ITransaction[]
  categories: ICategory[]
  open: boolean
  onClose: () => void
  range: { from: Date; to: Date }
  onRangeChange: (range: { from: Date; to: Date }) => void
  pageSize?: number
}

export function TransactionsListModal({
  transactions,
  categories,
  open,
  onClose,
  range,
  onRangeChange,
  pageSize = 20
}: Props) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>(
    'all'
  )
  const [filterCategory, setFilterCategory] = useState<number | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const updateDebounced = useMemo(
    () =>
      debounce((val: string) => {
        setDebouncedSearch(val)
        setCurrentPage(1)
      }, 350),
    []
  )

  useEffect(() => {
    if (open) {
      setSearch('')
      setDebouncedSearch('')
      setFilterType('all')
      setFilterCategory('all')
      onRangeChange(getCurrentMonthRange())
      setCurrentPage(1)
    }
    return () => updateDebounced.cancel()
  }, [open, updateDebounced])

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const category = categories.find(c => c.id === tx.categoryId)
      const matchesSearch = debouncedSearch
        ? tx.description
            ?.toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          category?.name.toLowerCase().includes(debouncedSearch.toLowerCase())
        : true
      const matchesType =
        filterType === 'all'
          ? true
          : filterType === 'income'
            ? tx.type === TransactionType.INCOME
            : tx.type === TransactionType.EXPENSE
      const matchesCategory =
        filterCategory === 'all' ? true : tx.categoryId === filterCategory
      const txDate = new Date(tx.transactionDate)
      const matchesDate = txDate >= range.from && txDate <= range.to
      return matchesSearch && matchesType && matchesCategory && matchesDate
    })
  }, [
    transactions,
    categories,
    debouncedSearch,
    filterType,
    filterCategory,
    range
  ])

  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    )
  }, [filteredTransactions, currentPage, pageSize])

  const totalPages = Math.ceil(filteredTransactions.length / pageSize)
  const hasActiveFilters =
    filterType !== 'all' || filterCategory !== 'all' || debouncedSearch !== ''

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
    >
      <DialogContent className="w-[95vw] max-w-5xl xl:max-w-6xl p-0 max-h-[90vh] overflow-y-auto border-none bg-transparent shadow-none">
        <GlassCard className="rounded-3xl p-4 sm:p-6 md:p-10 lg:p-14 shadow-2xl transition-all duration-500">
          <DialogHeader className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <DialogTitle className="text-xl sm:text-2xl font-bold">
                Список транзакций
              </DialogTitle>
              <Button
                variant={showFilters ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="relative flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Фильтры
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                )}
                <motion.div
                  animate={{ rotate: showFilters ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </Button>
            </div>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по описанию или категории"
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                updateDebounced(e.target.value.trim())
              }}
              className="pl-10"
            />
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <TransactionFilters
                  filterType={filterType}
                  setFilterType={v => {
                    setFilterType(v)
                    setCurrentPage(1)
                  }}
                  filterCategory={filterCategory}
                  setFilterCategory={v => {
                    setFilterCategory(v)
                    setCurrentPage(1)
                  }}
                  dateRange={range}
                  setDateRange={r => {
                    onRangeChange(r)
                    setCurrentPage(1)
                  }}
                  categories={categories}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Список и пагинация остаются без изменений */}
          <div className="hidden sm:grid grid-cols-12 gap-4 mb-2 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <div className="col-span-5">Описание / Категория</div>
            <div className="col-span-3">Дата</div>
            <div className="col-span-4 text-right">Сумма</div>
          </div>

          <div className="max-h-[45vh] overflow-y-auto rounded-xl border bg-card/50 backdrop-blur-sm">
            {paginatedTransactions.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                Транзакции не найдены
              </div>
            ) : (
              <div className="divide-y divide-border/50">
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

          {/* Пагинация упрощена для краткости примера */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <p>
                {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, filteredTransactions.length)}{' '}
                из {filteredTransactions.length}
              </p>
              <div className="flex gap-1">
                {Array.from({ length: totalPages })
                  .map((_, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant={currentPage === i + 1 ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(i + 1)}
                      className="w-8 h-8 p-0"
                    >
                      {i + 1}
                    </Button>
                  ))
                  .slice(
                    Math.max(0, currentPage - 3),
                    Math.min(totalPages, currentPage + 2)
                  )}
              </div>
            </div>
          )}
        </GlassCard>
      </DialogContent>
    </Dialog>
  )
}
