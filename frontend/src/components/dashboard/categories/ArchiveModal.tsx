'use client'

import { cn } from '@/lib/utils'
import { Archive, HelpCircle, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { GlassCard } from '@/components/ui/cards/glass-card'
import { ConfirmAlert } from '@/components/ui/dialogs/confirm-alert'
import { ModalHeader } from '@/components/ui/modal/modal-header'
import { Button } from '@/components/ui/shadui/button'
import { Dialog, DialogContent } from '@/components/ui/shadui/dialog'
import { Input } from '@/components/ui/shadui/input'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/shadui/tabs'

import { CategoryIcons, ICategory } from '@/types/category.types'

import { useCategories } from '@/hooks/useCategories'

interface ArchiveModalProps {
  isExpense: boolean
}

export function ArchiveModal({ isExpense }: ArchiveModalProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(
    null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>(
    isExpense ? 'expense' : 'income'
  )

  const { archived, unarchiveCategory, isUnarchiving } =
    useCategories(isExpense)

  // Фильтрация и сортировка категорий
  const filteredCategories = useMemo(() => {
    let filtered = archived.filter(cat =>
      activeTab === 'expense' ? cat.isExpense : !cat.isExpense
    )

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(cat => cat.name.toLowerCase().includes(query))
    }

    // Сортируем по названию
    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }, [archived, activeTab, searchQuery])

  const handleUnarchive = (category: ICategory) => {
    setSelectedCategory(category)
    setConfirmOpen(true)
  }

  const confirmUnarchive = async () => {
    if (!selectedCategory) return
    try {
      await unarchiveCategory(selectedCategory.id)
      setConfirmOpen(false)
      setSelectedCategory(null)
    } catch {}
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  // Подсчёт количества категорий по типам
  const { expenseCount, incomeCount } = useMemo(
    () => ({
      expenseCount: archived.filter(cat => cat.isExpense).length,
      incomeCount: archived.filter(cat => !cat.isExpense).length
    }),
    [archived]
  )

  return (
    <>
      {/* Кнопка открытия архива */}
      <button
        onClick={() => {
          setOpen(true)
          setActiveTab(isExpense ? 'expense' : 'income')
        }}
        className={cn(
          'size-10 rounded-full border flex items-center justify-center transition-all cursor-pointer hover:bg-muted',
          'aria-label="Открыть архив категорий"'
        )}
      >
        <Archive className="size-5" />
      </button>

      {/* Модалка архива */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent
          showCloseButton={false}
          className="w-[95vw] max-w-4xl p-0 max-h-[90vh] flex flex-col"
        >
          <GlassCard className="rounded-3xl p-6 md:p-8 flex flex-col h-full">
            <ModalHeader
              icon={<Archive className="size-6 text-white" />}
              title="Архив категорий"
              onClose={() => setOpen(false)}
              showDelete={false}
            />

            {/* Поиск */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Поиск категорий..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-11 rounded-xl bg-background/50"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Табы для переключения между расходами и доходами */}
            <Tabs
              value={activeTab}
              onValueChange={v => setActiveTab(v as 'expense' | 'income')}
              className="mt-6 flex-1 min-h-0 flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/50 p-1">
                <TabsTrigger
                  value="expense"
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer"
                >
                  Расходы ({expenseCount})
                </TabsTrigger>
                <TabsTrigger
                  value="income"
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer"
                >
                  Доходы ({incomeCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="expense"
                className="flex-1 mt-4 min-h-0 overflow-y-auto"
              >
                <CategoriesList
                  categories={filteredCategories}
                  onUnarchive={handleUnarchive}
                  isUnarchiving={isUnarchiving}
                  isEmpty={filteredCategories.length === 0}
                  searchQuery={searchQuery}
                />
              </TabsContent>

              <TabsContent
                value="income"
                className="flex-1 mt-4 min-h-0 overflow-y-auto"
              >
                <CategoriesList
                  categories={filteredCategories}
                  onUnarchive={handleUnarchive}
                  isUnarchiving={isUnarchiving}
                  isEmpty={filteredCategories.length === 0}
                  searchQuery={searchQuery}
                />
              </TabsContent>
            </Tabs>
          </GlassCard>
        </DialogContent>
      </Dialog>

      {/* Подтверждение восстановления */}
      <ConfirmAlert
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Восстановить категорию?"
        description={
          <>
            Категория <b>«{selectedCategory?.name}»</b> будет восстановлена из
            архива.
          </>
        }
        confirmText="Восстановить"
        cancelText="Отмена"
        loading={isUnarchiving}
        onConfirm={confirmUnarchive}
      />
    </>
  )
}

// Упрощённый компонент для списка категорий
interface CategoriesListProps {
  categories: ICategory[]
  onUnarchive: (category: ICategory) => void
  isUnarchiving: boolean
  isEmpty: boolean
  searchQuery: string
}

function CategoriesList({
  categories,
  onUnarchive,
  isUnarchiving,
  isEmpty,
  searchQuery
}: CategoriesListProps) {
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Archive className="size-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">
          {searchQuery ? 'Ничего не найдено по вашему запросу' : 'Архив пуст'}
        </p>
        {searchQuery && (
          <p className="text-sm text-muted-foreground/70 mt-1">
            Попробуйте изменить поисковый запрос
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-2 pb-4">
      {categories.map(category => {
        const Icon =
          category.icon && CategoryIcons[category.icon]
            ? CategoryIcons[category.icon]
            : HelpCircle

        return (
          <div
            key={category.id}
            className="group flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/50 hover:bg-card/80 hover:border-border transition-all"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={cn(
                  'flex items-center justify-center size-10 rounded-xl shrink-0',
                  category.isExpense ? 'bg-destructive/10' : 'bg-success/10'
                )}
              >
                <Icon
                  className={cn(
                    'size-5',
                    category.isExpense ? 'text-destructive' : 'text-success'
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{category.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      category.isExpense
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-success/10 text-success'
                    )}
                  >
                    {category.isExpense ? 'Расход' : 'Доход'}
                  </span>
                  {category.parentId && (
                    <span className="text-xs text-muted-foreground">
                      Подкатегория
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUnarchive(category)}
              disabled={isUnarchiving}
              className="h-9 px-4 text-sm hover:bg-accent/10 hover:text-accent-foreground shrink-0 ml-2 cursor-pointer"
            >
              Восстановить
            </Button>
          </div>
        )
      })}
    </div>
  )
}
