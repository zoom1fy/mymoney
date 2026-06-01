'use client'

import { Pencil, Plus } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { AccentButton } from '@/components/ui/buttons/accent-button'
import { GlassCard } from '@/components/ui/cards/glass-card'
import { ConfirmAlert } from '@/components/ui/dialogs/confirm-alert'
import { ModalHeader } from '@/components/ui/modal/modal-header'
import { Button } from '@/components/ui/shadui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
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

import { getRandomColor } from '@/lib/color-utils'
import { cn } from '@/lib/utils'
import { ColorPicker } from '@/components/ui/color-picker/ColorPicker'

const iconOptions = Object.keys(CategoryIcons) as CategoryIconName[]

interface Props {
  isExpense: boolean
  mode?: 'create' | 'edit'
  category?: ICategory
  trigger?: ReactNode
  onClose?: () => void
}

export function CategoryModal({
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
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const isEdit = mode === 'edit'
  const isLoading = isCreating || isUpdating || isDeleting

  const handleClose = () => {
    setOpen(false)
    if (isEdit) onClose?.()
  }

  const attemptClose = () => {
    if (isDirty) {
      setCloseConfirmOpen(true)
      return
    }
    handleClose()
  }

  const confirmClose = () => {
    setCloseConfirmOpen(false)
    handleClose()
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors, isDirty }
  } = useForm<ICreateCategory>({
    defaultValues: {
      name: '',
      isExpense,
      icon: 'Circle',
      color: getRandomColor()
    }
  })

  // Открыть модалку при редактировании
  useEffect(() => {
    if (isEdit && category) {
      setOpen(true)
    }
  }, [isEdit, category])

  // Инициализация формы при открытии
  useEffect(() => {
    if (!open) return

    if (isEdit && category) {
      reset({
        name: category.name,
        icon: category.icon,
        isExpense: category.isExpense,
        color: category.color || getRandomColor()
      })
    } else {
      reset({
        name: '',
        isExpense,
        icon: 'Circle',
        color: getRandomColor()
      })
    }
  }, [open, isEdit, category, reset, isExpense])

  const selectedIcon = watch('icon')

  const onSubmit = async (data: ICreateCategory) => {
    try {
      if (isEdit && category) {
        await updateCategory({ id: category.id, data })
      } else {
        await createCategory({ ...data, currencyCode: CurrencyCode.RUB })
      }
      setOpen(false)
    } catch {}
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          attemptClose()
          return
        }
        setOpen(true)
      }}
    >
      {mode === 'create' && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button
              className="w-full gap-2"
              variant="outline"
            >
              <Plus className="size-4" /> Добавить категорию
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent
        className="w-[95vw] max-w-3xl p-0 border-none bg-transparent"
        showCloseButton={false}
      >
        <GlassCard className="rounded-3xl p-6 sm:p-10">
          <DialogHeader className="mb-8">
            <ModalHeader
              actionType="archive"
              icon={
                isEdit ? (
                  <Pencil className="size-6 text-white" />
                ) : (
                  <Plus className="size-6 text-white" />
                )
              }
              showDelete={isEdit && !!category}
              title={isEdit ? 'Редактирование' : 'Новая категория'}
              onClose={attemptClose}
              onDelete={() => setConfirmOpen(true)}
            />
          </DialogHeader>

          <form
            className="space-y-8"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="space-y-3">
              <Label className="text-lg">Название</Label>
              <Input
                className="h-14 text-lg px-6 bg-background"
                placeholder="Продукты"
                {...register('name', { required: 'Введите название' })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-lg">Иконка</Label>
              <ScrollArea className="h-64 rounded-xl border bg-background/50">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 p-4">
                  {iconOptions.map(icon => {
                    const Icon = CategoryIcons[icon]
                    const active = selectedIcon === icon
                    return (
                      <button
                        className={cn(
                          'flex size-14 items-center justify-center rounded-xl border-2 transition-all',
                          active
                            ? 'border-accent bg-accent/20 scale-110'
                            : 'border-transparent hover:bg-accent/10'
                        )}
                        key={icon}
                        type="button"
                        onClick={() => setValue('icon', icon)}
                      >
                        <Icon className="size-7" />
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>

            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <ColorPicker
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <AccentButton
                className="h-14 sm:flex-1"
                disabled={isLoading}
                size="lg"
                type="submit"
              >
                {isEdit ? 'Сохранить' : 'Создать'}
              </AccentButton>
              <AccentButton
                className="h-14 sm:flex-1"
                size="lg"
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Отмена
              </AccentButton>
            </div>
          </form>
        </GlassCard>
      </DialogContent>

      <ConfirmAlert
        confirmText="Архивировать"
        description={
          <>
            Категория <b>«{category?.name}»</b> будет перемещена в архив.
          </>
        }
        loading={isDeleting}
        open={confirmOpen}
        title="Архивировать категорию?"
        onConfirm={async () => {
          if (category) await deleteCategory(category.id)
          setConfirmOpen(false)
          setOpen(false)
        }}
        onOpenChange={setConfirmOpen}
      />

      <ConfirmAlert
        cancelText="Остаться"
        confirmText="Закрыть"
        description="У вас есть несохранённые изменения. Вы уверены, что хотите закрыть?"
        destructive={false}
        open={closeConfirmOpen}
        title="Несохранённые изменения"
        onConfirm={confirmClose}
        onOpenChange={setCloseConfirmOpen}
      />
    </Dialog>
  )
}
