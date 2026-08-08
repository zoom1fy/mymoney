'use client'

import debounce from 'lodash/debounce'
import { AnimatePresence, motion } from 'framer-motion'
import { ReceiptText, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { GlassCard } from '@/components/ui/cards/glass-card'
import { ModalHeader } from '@/components/ui/modal/modal-header'
import { Button } from '@/components/ui/shadui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader
} from '@/components/ui/shadui/dialog'
import { Input } from '@/components/ui/shadui/input'


import { ICategory } from '@/types/category.type'
import { ITransaction, TransactionType } from '@/types/transaction.type'

import { TransactionFilters } from './transaction-filters'
import { TransactionItem } from './transaction-list-item'
import { TransactionModal } from './transaction-modal'

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
  isOpen: boolean
  onClose: () => void
  range: { from: Date; to: Date }
  onRangeChange: (range: { from: Date; to: Date }) => void
  pageSize?: number
}

export function TransactionsListModal({
  transactions,
  categories,
  isOpen,
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
  const [editingTx, setEditingTx] = useState<ITransaction | null>(null)

  // Debounce search input by 350ms before filtering to avoid UI lag
  const updateDebounced = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value)
        setCurrentPage(1)
      }, 350),
    []
  )

  // Reset all filters when dialog opens; cancel debounce on unmount
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setDebouncedSearch('')
      setFilterType('all')
      setFilterCategory('all')
      onRangeChange(getCurrentMonthRange())
      setCurrentPage(1)
    }
    return () => updateDebounced.cancel()
  }, [isOpen, updateDebounced, onRangeChange])

  // Category lookup map avoids O(n·m) search per transaction and per render
  const categoryMap = useMemo(
    () => new Map(categories.map(c => [c.id, c])),
    [categories]
  )

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const category = categoryMap.get(tx.categoryId!)
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
    categoryMap,
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

  // Stable callback so memoized TransactionItem cards don't re-render on every keystroke
  const handleEdit = useCallback((tx: ITransaction) => setEditingTx(tx), [])

  const categoryForEditing = editingTx
    ? categoryMap.get(editingTx.categoryId!)
    : undefined

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="w-[95vw] max-w-5xl sm:max-w-5xl xl:max-w-6xl p-0 max-h-[90vh] overflow-y-auto border-none bg-transparent shadow-none" showCloseButton={false}>
        <GlassCard className="rounded-3xl p-4 sm:p-6 md:p-10 lg:p-14 shadow-2xl transition-all duration-500">
          <DialogHeader className="mb-6">
            <ModalHeader
              icon={<ReceiptText className="size-6 text-white" />}
              title="Список транзакций"
              onClose={onClose}
            />
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4 lg:h-[60vh] lg:flex lg:flex-col">
              <div className="relative shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="h-12 pl-12 text-[15px] rounded-xl bg-card/50 border-border/60"
                  placeholder="Поиск транзакций..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value)
                    updateDebounced(e.target.value.trim())
                  }}
                />
              </div>

              <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
                <TransactionFilters
                  categories={categories}
                  dateRange={range}
                  filterCategory={filterCategory}
                  filterType={filterType}
                  setDateRange={r => {
                    onRangeChange(r)
                    setCurrentPage(1)
                  }}
                  setFilterCategory={v => {
                    setFilterCategory(v)
                    setCurrentPage(1)
                  }}
                  setFilterType={v => {
                    setFilterType(v)
                    setCurrentPage(1)
                  }}
                />
              </div>
            </div>

            <div className="min-w-0 lg:h-[60vh] lg:flex lg:flex-col">
              <div className="max-h-[50vh] lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto pr-1 rounded-2xl border border-border/60 bg-card/50 p-2">
                {paginatedTransactions.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">
                    Транзакции не найдены
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {paginatedTransactions.map(tx => (
                      <TransactionItem
                        category={categoryMap.get(tx.categoryId!)!}
                        key={tx.id}
                        transaction={tx}
                        onEdit={handleEdit}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination with windowed page buttons; height/opacity animate in and out with the list card resizing below */}
              <AnimatePresence initial={false}>
                {totalPages > 1 && (
                  <motion.div
                    key="pagination"
                    className="overflow-hidden"
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    initial={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
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
                              className="w-8 h-8 p-0"
                              key={i}
                              size="sm"
                              variant={currentPage === i + 1 ? 'default' : 'outline'}
                              onClick={() => setCurrentPage(i + 1)}
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </GlassCard>

        {/* Single edit modal reused for any selected transaction */}
        {categoryForEditing && (
          <TransactionModal
            category={categoryForEditing}
            isExpense={editingTx!.type === TransactionType.EXPENSE}
            isOpen={!!editingTx}
            mode="edit"
            transaction={editingTx!}
            onOpenChange={isOpen => {
              if (!isOpen) setEditingTx(null)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
