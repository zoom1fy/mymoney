'use client'

import { CategoryGrid } from './CategoryGrid'
import { CategoryToggle } from './CategoryToggle'
import { EditModeButton } from './EditModeButton'
import { useState } from 'react'

import { useCategories } from '@/hooks/useCategories'

interface Props {
  isExpense: boolean
  onExpenseChange: (value: boolean) => void
  donutData?: any[]
  loading?: boolean
}

export function CategoriesPanel({
  isExpense,
  onExpenseChange,
  donutData,
  loading
}: Props) {
  const [editMode, setEditMode] = useState(false)
  const { categories } = useCategories(isExpense)

  return (
    <div className="w-[360px] lg:w-[460px] shrink-0">
      <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <CategoryToggle
              isExpense={isExpense}
              onChange={onExpenseChange}
            />
          </div>
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
