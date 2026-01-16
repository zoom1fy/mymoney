'use client'

import { CategoryGrid } from './CategoryGrid'
import { CategoryToggle } from './CategoryToggle'
import { EditModeButton } from './EditModeButton'
import { useState } from 'react'

import { useCategories } from '@/hooks/useCategories'

export function CategoriesPanel() {
  const [isExpense, setIsExpense] = useState(true)
  const [editMode, setEditMode] = useState(false)

  const { categories, isLoading } = useCategories(isExpense)

  return (
    <div className="w-[360px] shrink-0">
      <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <CategoryToggle
              isExpense={isExpense}
              onChange={setIsExpense}
            />
          </div>

          <EditModeButton
            active={editMode}
            onToggle={() => setEditMode(v => !v)}
          />
        </div>

        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground">
            Загрузка категорий...
          </p>
        ) : (
          <CategoryGrid
            categories={categories}
            isExpense={isExpense}
            editMode={editMode}
          />
        )}
      </div>
    </div>
  )
}
