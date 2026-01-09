import { CategoryItem } from './CategoryItem'
import { CreateCategoryModal } from './CreateCategoryModal'
import { Plus } from 'lucide-react'

import { ICategory } from '@/types/category.types'

export function CategoryGrid({
  categories,
  isExpense
}: {
  categories: ICategory[]
  isExpense: boolean
}) {
  const rootCategories = categories.filter(c => !c.parentId)

  return (
    <div className="md:h-[560px] sm:h-[400px] h-[300px] overflow-y-auto pr-1">
      <div className="grid grid-cols-3 gap-6">
        {rootCategories.map(cat => (
          <CategoryItem
            key={cat.id}
            name={cat.name}
            icon={cat.icon}
          />
        ))}

        {/* Кнопка добавления */}
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
      </div>
    </div>
  )
}
