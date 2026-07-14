'use client'

import { useState } from 'react'

import { ICategory } from '@/types/category.type'

import { DonutItem } from '@/lib/transactions-donut'

import { ArchiveModal } from './archive-modal'
import { CategoryGrid } from './category-grid'
import { CategoryToggle } from './category-toggle'
import { EditModeButton } from './edit-mode-button'

interface Props {
  isExpense: boolean
  onExpenseChange: (value: boolean) => void
  donutData?: DonutItem[]
  categories: ICategory[]
  isLoading?: boolean
}

export function CategoriesPanel({
  isExpense,
  onExpenseChange,
  donutData,
  categories,
  isLoading
}: Props) {
  const [isEditMode, setIsEditMode] = useState(false)

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
          {/* Archive / edit mode buttons */}
          <ArchiveModal isExpense={isExpense} />
          <EditModeButton
            isActive={isEditMode}
            onToggle={() => setIsEditMode(current => !current)}
          />
        </div>

        <CategoryGrid
          categories={categories}
          donutData={donutData}
          isEditMode={isEditMode}
          isExpense={isExpense}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
