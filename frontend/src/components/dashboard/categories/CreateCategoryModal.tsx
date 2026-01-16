'use client'

import { cn } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { AccentButton } from '@/components/ui/buttons/accent-button'
import { GlassCard } from '@/components/ui/cards/glass-card'
import { ConfirmAlert } from '@/components/ui/dialogs/confirm-alert'
import { Button } from '@/components/ui/shadui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/shadui/dialog'
import { Input } from '@/components/ui/shadui/input'
import { Label } from '@/components/ui/shadui/label'
import { ScrollArea } from '@/components/ui/shadui/scroll-area'

import { CurrencyCode } from '@/types/account.types'
import {
  CategoryIconName,
  CategoryIcons,
  ICategory,
  ICreateCategory
} from '@/types/category.types'

import { useCategories } from '@/hooks/useCategories'

const iconOptions = Object.keys(CategoryIcons) as CategoryIconName[]

interface Props {
  isExpense: boolean
  mode?: 'create' | 'edit'
  category?: ICategory
  trigger?: ReactNode
  onClose?: () => void
}

export function CreateCategoryModal({
  isExpense,
  mode = 'create',
  category,
  trigger,
  onClose
}: Props) {
  const {
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting
  } = useCategories(isExpense)

  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isEdit = mode === 'edit'
  const isLoading = isCreating || isUpdating || isDeleting

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<ICreateCategory>({
    defaultValues: {
      name: '',
      isExpense,
      icon: 'Circle'
    }
  })

  useEffect(() => {
    if (mode === 'edit' && category) {
      setOpen(true)
    }
  }, [mode, category])

  useEffect(() => {
    if (open && isEdit && category) {
      reset({
        name: category.name,
        icon: category.icon,
        isExpense: category.isExpense
      })
    }
  }, [open, isEdit, category, reset])

  const selectedIcon = watch('icon')

  const onSubmit = async (data: ICreateCategory) => {
    try {
      if (isEdit && category) {
        await updateCategory({
          id: category.id,
          data
        })
      } else {
        await createCategory({
          ...data,
          isExpense,
          currencyCode: CurrencyCode.RUB
        })
      }

      setOpen(false)
      reset()
    } catch {}
  }

  const handleDelete = async () => {
    if (!category) return

    try {
      await deleteCategory(category.id)
      setConfirmOpen(false)
      setOpen(false)
    } catch {}
  }

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        setOpen(v)
        if (!v && mode === 'edit') {
          onClose?.()
        }
      }}
    >
      {mode === 'create' && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button
              variant="outline"
              className="w-full justify-center gap-2"
            >
              <Plus className="size-4" />
              Добавить категорию
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="w-[95vw] max-w-3xl p-0">
        <GlassCard className="rounded-3xl p-10">
          <DialogHeader className="mb-8">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-3xl font-bold tracking-tight">
                {isEdit ? 'Редактировать' : 'Новая категория'}
              </DialogTitle>

              {isEdit && category && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmOpen(true)}
                  disabled={isLoading}
                  className="text-destructive hover:bg-destructive/10 cursor-pointer shrink-0 p-6"
                >
                  <Trash2 className="size-5 sm:size-6" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8"
          >
            {/* Название */}
            <div className="space-y-3">
              <Label className="text-lg">Название</Label>
              <Input
                placeholder="Продукты"
                className="h-14 text-lg px-6"
                {...register('name', { required: 'Введите название' })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Иконки */}
            <ScrollArea className="h-64 rounded-xl border bg-background/50">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-5 gap-4 p-4">
                {iconOptions.map(icon => {
                  const Icon = CategoryIcons[icon]
                  const active = selectedIcon === icon

                  return (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setValue('icon', icon)}
                      className={cn(
                        'flex size-16 items-center justify-center rounded-xl border-2 transition-all cursor-pointer',
                        active
                          ? 'border-accent bg-accent/20 shadow-xl scale-110'
                          : 'border-transparent hover:border-accent/50 hover:bg-accent/10 hover:scale-105'
                      )}
                    >
                      <Icon className="size-8" />
                    </button>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Кнопки */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <AccentButton
                type="submit"
                size="lg"
                className="h-14 sm:flex-1"
                disabled={isLoading}
              >
                {isEdit ? 'Сохранить' : 'Создать'}
              </AccentButton>

              <AccentButton
                type="button"
                variant="ghost"
                size="lg"
                className="h-14 sm:flex-1"
                onClick={() => setOpen(false)}
              >
                Отмена
              </AccentButton>
            </div>
          </form>
        </GlassCard>
      </DialogContent>
      <ConfirmAlert
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Удалить категорию?"
        description={
          <>
            Категория <b>«{category?.name}»</b> будет удалена навсегда.
            <br />
            Это действие нельзя отменить.
          </>
        }
        confirmText="Удалить"
        cancelText="Отмена"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </Dialog>
  )
}
