'use client'

import { CategoryGrid } from './CategoryGrid'
import { CategoryToggle } from './CategoryToggle'
import { useState } from 'react'

import { useCategories } from '@/hooks/useCategories'

export function CategoriesPanel() {
  const [isExpense, setIsExpense] = useState(true)
  const { categories, isLoading } = useCategories(isExpense)

  return (
    <div className="w-[360px] shrink-0">
      <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-6 space-y-6">
        <CategoryToggle
          isExpense={isExpense}
          onChange={setIsExpense}
        />

        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground">
            Загрузка категорий...
          </p>
        ) : (
          <CategoryGrid
            categories={categories}
            isExpense={isExpense}
          />
        )}
      </div>
    </div>
  )
}
