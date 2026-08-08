'use client'

import { CalendarDays } from 'lucide-react'

import { DateRangePicker } from '@/components/dashboard/transactions/date-range-picker'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadui/select'

import { ICategory } from '@/types/category.type'

type FilterType = 'all' | 'income' | 'expense'

interface TransactionFiltersProps {
  filterType: FilterType
  setFilterType: (value: FilterType) => void
  filterCategory: number | 'all'
  setFilterCategory: (value: number | 'all') => void
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
  const expenseCategories = categories.filter(c => c.isExpense)
  const incomeCategories = categories.filter(c => !c.isExpense)
  const categoryGroups = [
    { title: 'Расходы', items: expenseCategories },
    { title: 'Доходы', items: incomeCategories }
  ].filter(group => group.items.length > 0)

  return (
    <div className="h-full space-y-4 rounded-2xl border border-border/60 bg-card/50 p-4">
      <SegmentedControl
        options={[
          { value: 'all', label: 'Все' },
          { value: 'expense', label: 'Расходы' },
          { value: 'income', label: 'Доходы' }
        ]}
        value={filterType}
        onChange={setFilterType}
      />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-muted-foreground ml-1">
            Категория
          </label>
          <Select
            value={filterCategory.toString()}
            onValueChange={value =>
              setFilterCategory(value === 'all' ? 'all' : Number(value))
            }
          >
            <SelectTrigger className="bg-background w-full h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] bg-background">
              <SelectItem value="all">Все категории</SelectItem>
              {categoryGroups.map(group => (
                <div key={group.title}>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>{group.title}</SelectLabel>
                    {group.items.map(c => (
                      <SelectItem
                        key={c.id}
                        value={c.id.toString()}
                      >
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-muted-foreground ml-1 flex items-center gap-1.5">
            <CalendarDays className="size-3.5" /> Период
          </label>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      </div>
    </div>
  )
}
