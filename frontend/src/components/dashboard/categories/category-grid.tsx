'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'

import { ICategory } from '@/types/category.type'

import { TransactionModal } from '../transactions/transaction-modal'
import { CategoryItem } from './category-item'
import { CategoryItemSkeleton } from './category-item-skeleton'
import { CategoryModal } from './category-modal'

interface Props {
  categories: ICategory[]
  isExpense: boolean
  isEditMode: boolean
  donutData?: { id: number; value: number; color?: string }[]
  isLoading?: boolean
}

export function CategoryGrid({
  categories,
  isExpense,
  isEditMode,
  donutData,
  isLoading
}: Props) {
  const filteredCategories = categories.filter(c => c.isExpense === isExpense)
  const rootCategories = filteredCategories.filter(c => !c.parentId)

  const dataMap = new Map(
    donutData?.map(d => [d.id, { amount: d.value, color: d.color }]) || []
  )

  const [editCategory, setEditCategory] = useState<ICategory | null>(null)
  const [transactionCategory, setTransactionCategory] =
    useState<ICategory | null>(null)

  const skeletonCount = 9

  return (
    <>
      <div className="h-[560px] overflow-y-auto pr-2 pt-1">
        <div className="grid grid-cols-3 gap-6">
          {isLoading
            ? // Loading state: show skeleton placeholders
              Array.from({ length: skeletonCount }).map((_, index) => (
                <CategoryItemSkeleton key={`skeleton-${index}`} />
              ))
            : // Actual categories
              rootCategories.map(cat => {
                const info = dataMap.get(cat.id) || {
                  amount: 0,
                  color: undefined
                }

                return (
                  <CategoryItem
                    amount={info.amount}
                    color={info.color}
                    isEditMode={isEditMode}
                    icon={cat.icon}
                    key={cat.id}
                    name={cat.name}
                    onClick={() => {
                      if (isEditMode) {
                        setEditCategory(cat)
                      } else {
                        setTransactionCategory(cat)
                      }
                    }}
                  />
                )
              })}

          {/* Add button shown only after data has loaded */}
          {!isLoading && (
            <CategoryModal
              isExpense={isExpense}
              trigger={
                <button className="flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="size-16 rounded-full border border-dashed flex items-center justify-center transition-all group-hover:bg-primary/10">
                    <Plus className="size-6 text-muted-foreground transition-all duration-500 group-hover:rotate-90" />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Добавить
                  </span>
                </button>
              }
            />
          )}
        </div>
      </div>

      {editCategory && (
        <CategoryModal
          category={editCategory}
          isExpense={isExpense}
          mode="edit"
          onClose={() => setEditCategory(null)}
        />
      )}

      {transactionCategory && (
        <TransactionModal
          category={transactionCategory}
          isExpense={isExpense}
          mode="create"
          isOpen={!!transactionCategory}
          onOpenChange={open => {
            if (!open) setTransactionCategory(null)
          }}
        />
      )}
    </>
  )
}
