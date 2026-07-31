'use client'

import { Palette, Pencil, Plus, Tags } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { AccentButton } from '@/components/ui/buttons/accent-button'
import { GlassCard } from '@/components/ui/cards/glass-card'
import { ColorPicker } from '@/components/ui/color-picker/color-picker'
import { ConfirmAlert } from '@/components/ui/dialogs/confirm-alert'
import { IconPicker } from '@/components/ui/icon-picker/icon-picker'
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

import {
  categoryIcons,
  ICategory,
  ICreateCategory
} from '@/types/category.type'

import { useCategories } from '@/hooks/use-categories'

import { getRandomColor } from '@/lib/color-utils'
import { cn } from '@/lib/cn'

interface Props {
  isExpense: boolean
  mode?: 'create' | 'edit'
  category?: ICategory
  trigger?: ReactNode
  onClose?: () => void
}

const fieldClasses =
  '!h-14 w-full text-lg px-6 rounded-xl bg-background border-2'
const containerClasses = 'w-full min-w-0 space-y-2'

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
  const [isOpen, setIsOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false)
  const isEdit = mode === 'edit'
  const isLoading = isCreating || isUpdating || isDeleting

  const handleClose = () => {
    setIsOpen(false)
    if (isEdit) onClose?.()
  }

  const attemptClose = () => {
    if (isDirty) {
      setIsCloseConfirmOpen(true)
      return
    }
    handleClose()
  }

  const confirmClose = () => {
    setIsCloseConfirmOpen(false)
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

  // Auto-open the dialog when editing (trigger-less mode)
  useEffect(() => {
    if (isEdit && category) {
      setIsOpen(true)
    }
  }, [isEdit, category])

  // Populate form fields when dialog opens (edit → prefill, create → defaults)
  useEffect(() => {
    if (!isOpen) return

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
  }, [isOpen, isEdit, category, reset, isExpense])

  const selectedIcon = watch('icon')

  const onSubmit = async (data: ICreateCategory) => {
    try {
      if (isEdit && category) {
        await updateCategory({ id: category.id, data })
      } else {
        await createCategory({ ...data, currencyCode: 'RUB' })
      }
    handleClose()
  } catch {}
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          attemptClose()
          return
        }
        setIsOpen(true)
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
        <GlassCard className="rounded-2xl p-8 md:p-10 shadow-xl transition-all duration-700">
          <DialogHeader className="mb-4">
            <ModalHeader
              actionType="archive"
              icon={
                isEdit ? (
                  <Pencil className="size-6 text-white" />
                ) : (
                  <Plus className="size-6 text-white" />
                )
              }
              isDeleteVisible={isEdit && !!category}
              title={isEdit ? 'Редактирование' : 'Новая категория'}
              onClose={attemptClose}
              onDelete={() => setIsConfirmOpen(true)}
            />
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className={containerClasses}>
              <Label className="text-base font-medium ml-1 flex items-center gap-2">
                <Tags className="size-4 opacity-70" /> Название
              </Label>
              <Input
                className={cn(fieldClasses)}
                placeholder="Продукты"
                {...register('name', { required: 'Введите название' })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className={containerClasses}>
              <Label className="text-base font-medium ml-1 flex items-center gap-2">
                <Palette className="size-4 opacity-70" /> Иконка
              </Label>
              <IconPicker
                buttonClassName="size-14"
                gridClassName="sm:grid-cols-6"
                iconClassName="size-7"
                icons={categoryIcons}
                scrollAreaClassName="h-64"
                value={selectedIcon}
                onChange={icon => setValue('icon', icon)}
              />
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
                onClick={handleClose}
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
        isLoading={isDeleting}
        isOpen={isConfirmOpen}
        title="Архивировать категорию?"
        onConfirm={async () => {
          if (category) await deleteCategory(category.id)
          setIsConfirmOpen(false)
          handleClose()
        }}
        onOpenChange={setIsConfirmOpen}
      />

      <ConfirmAlert
        cancelText="Остаться"
        confirmText="Закрыть"
        description="У вас есть несохранённые изменения. Вы уверены, что хотите закрыть?"
        isDestructive={false}
        isOpen={isCloseConfirmOpen}
        title="Несохранённые изменения"
        onConfirm={confirmClose}
        onOpenChange={setIsCloseConfirmOpen}
      />
    </Dialog>
  )
}
