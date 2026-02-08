'use client'

import { CategoryItem } from './CategoryItem'
import { CategoryItemSkeleton } from './CategoryItemSkeleton'
import { CreateCategoryModal } from './CreateCategoryModal'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { CreateTransactionModal } from '@/components/dashboard/transactions/CreateTransactionModal'

import { ICategory } from '@/types/category.types'

interface Props {
  categories: ICategory[]
  isExpense: boolean
  editMode: boolean
  donutData?: any[]
  loading?: boolean
}

export function CategoryGrid({
  categories,
  isExpense,
  editMode,
  donutData,
  loading
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
          {loading
            ? // Скелетоны вместо категорий
              Array.from({ length: skeletonCount }).map((_, index) => (
                <CategoryItemSkeleton key={`skeleton-${index}`} />
              ))
            : // Реальные категории
              rootCategories.map(cat => {
                const info = dataMap.get(cat.id) || {
                  amount: 0,
                  color: undefined
                }

                return (
                  <CategoryItem
                    key={cat.id}
                    name={cat.name}
                    icon={cat.icon}
                    editMode={editMode}
                    amount={info.amount}
                    color={info.color}
                    onClick={() => {
                      if (editMode) {
                        setEditCategory(cat)
                      } else {
                        setTransactionCategory(cat)
                      }
                    }}
                  />
                )
              })}

          {/* Кнопка "Добавить" показываем ТОЛЬКО когда НЕ загружаемся */}
          {!loading && (
            <CreateCategoryModal
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
        <CreateCategoryModal
          mode="edit"
          category={editCategory}
          isExpense={isExpense}
          onClose={() => setEditCategory(null)}
        />
      )}

      {transactionCategory && (
        <CreateTransactionModal
          open={!!transactionCategory}
          category={transactionCategory}
          isExpense={isExpense}
          onClose={() => setTransactionCategory(null)}
        />
      )}
    </>
  )
}
