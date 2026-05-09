'use client'

import { useState } from 'react'

import { ICategory } from '@/types/category.types'

import { DonutItem } from '@/lib/transactions-donut'

import { ArchiveModal } from './ArchiveModal'
import { CategoryGrid } from './CategoryGrid'
import { CategoryToggle } from './CategoryToggle'
import { EditModeButton } from './EditModeButton'

interface Props {
  isExpense: boolean
  onExpenseChange: (value: boolean) => void
  donutData?: DonutItem[]
  categories: ICategory[]
  loading?: boolean
}

export function CategoriesPanel({
  isExpense,
  onExpenseChange,
  donutData,
  categories,
  loading
}: Props) {
  const [editMode, setEditMode] = useState(false)

  return (
    <div className="w-full">
      <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <CategoryToggle
              isExpense={isExpense}
              onChange={onExpenseChange}
            />
          </div>
          {/* Кнопка архива */}
          <ArchiveModal isExpense={isExpense} />
          <EditModeButton
            active={editMode}
            onToggle={() => setEditMode(v => !v)}
          />
        </div>

        <CategoryGrid
          categories={categories}
          isExpense={isExpense}
          editMode={editMode}
          donutData={donutData}
          loading={loading}
        />
      </div>
    </div>
  )
}
