'use client'

import { ArchiveModal } from './ArchiveModal'
import { CategoryGrid } from './CategoryGrid'
import { CategoryToggle } from './CategoryToggle'
import { EditModeButton } from './EditModeButton'
import { useState } from 'react'

import { ICategory } from '@/types/category.types'

interface Props {
  isExpense: boolean
  onExpenseChange: (value: boolean) => void
  donutData?: any[]
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
