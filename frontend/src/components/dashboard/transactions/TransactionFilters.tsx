'use client'

import { CalendarDays } from 'lucide-react'

import { DateRangePicker } from '@/components/dashboard/transactions/DateRangePicker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadui/select'

import { ICategory } from '@/types/category.types'

interface TransactionFiltersProps {
  filterType: 'all' | 'income' | 'expense'
  setFilterType: (v: 'all' | 'income' | 'expense') => void
  filterCategory: number | 'all'
  setFilterCategory: (v: number | 'all') => void
  dateRange: { from: Date; to: Date }
  setDateRange: (range: { from: Date; to: Date }) => void
  categories: ICategory[]
}

export function TransactionFilters({
  filterType,
  setFilterType,
  filterCategory,
  setFilterCategory,
  dateRange,
  setDateRange,
  categories
}: TransactionFiltersProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        {/* Тип операции */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            Тип
          </label>
          <Select
            value={filterType}
            onValueChange={setFilterType}
          >
            <SelectTrigger className="bg-background w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">Все транзакции</SelectItem>
              <SelectItem value="income">Доходы</SelectItem>
              <SelectItem value="expense">Расходы</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Категория */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            Категория
          </label>
          <Select
            value={filterCategory.toString()}
            onValueChange={v =>
              setFilterCategory(v === 'all' ? 'all' : Number(v))
            }
          >
            <SelectTrigger className="bg-background w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] bg-background">
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

      {/* Период */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-2">
          <CalendarDays className="h-3 w-3" /> Период
        </label>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>
    </div>
  )
}
