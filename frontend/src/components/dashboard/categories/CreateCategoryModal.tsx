'use client'

import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { useForm } from 'react-hook-form'

import { AccentButton } from '@/components/ui/buttons/accent-button'
import { GlassCard } from '@/components/ui/cards/glass-card'
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
  ICreateCategory
} from '@/types/category.types'

import { useCategories } from '@/hooks/useCategories'

const iconOptions = Object.keys(CategoryIcons) as CategoryIconName[]

interface Props {
  isExpense: boolean
  trigger?: ReactNode
}

export function CreateCategoryModal({ isExpense, trigger }: Props) {
  const { createCategory, isCreating } = useCategories(isExpense)
  const [open, setOpen] = useState(false)

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

  const selectedIcon = watch('icon')

  const onSubmit = async (data: ICreateCategory) => {
    try {
      await createCategory({
        ...data,
        isExpense,
        currencyCode: CurrencyCode.RUB
      })

      setOpen(false)
      reset()
    } catch {}
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
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

      <DialogContent className="w-[95vw] max-w-3xl p-0">
        <GlassCard className="rounded-3xl p-10">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-bold tracking-tight">
              Новая категория
            </DialogTitle>
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
            <div className="flex gap-4">
              <AccentButton
                type="submit"
                size="lg"
                className="flex-1 h-14"
                disabled={isCreating}
              >
                Создать
              </AccentButton>

              <AccentButton
                type="button"
                variant="ghost"
                size="lg"
                className="flex-1 h-14"
                onClick={() => setOpen(false)}
              >
                Отмена
              </AccentButton>
            </div>
          </form>
        </GlassCard>
      </DialogContent>
    </Dialog>
  )
}
