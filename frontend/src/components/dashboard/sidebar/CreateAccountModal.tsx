'use client'

import { ConfirmAlert } from '../../ui/dialogs/confirm-alert'
import { cn } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadui/select'

import {
  AccountCategoryEnum,
  AccountIconName,
  AccountIcons,
  AccountTypeEnum,
  CurrencyCode,
  IAccount,
  ICreateAccount
} from '@/types/account.types'

import { useAccounts } from '@/hooks/useAccounts'

const iconOptions = Object.keys(AccountIcons) as AccountIconName[]

interface Props {
  mode?: 'create' | 'edit'
  account?: IAccount
  trigger?: ReactNode
}

export function CreateAccountModal({
  mode = 'create',
  account,
  trigger
}: Props) {
  const isEdit = mode === 'edit'

  const {
    createAccount,
    updateAccount,
    deleteAccount,
    isCreating,
    isUpdating,
    isDeleting
  } = useAccounts()

  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleDelete = async () => {
    if (!account) return

    try {
      await deleteAccount(account.id)
      setConfirmOpen(false)
      setOpen(false) // закрываем основную модалку
    } catch {
      // toast уже есть
    }
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ICreateAccount>({
    defaultValues: {
      name: '',
      currentBalance: 0,
      categoryId: AccountCategoryEnum.ACCOUNTS,
      typeId: AccountTypeEnum.CARD,
      currencyCode: CurrencyCode.RUB
    }
  })

  /** 🔹 При открытии edit — заполняем форму */
  useEffect(() => {
    if (open && isEdit && account) {
      reset({
        name: account.name,
        currentBalance: account.currentBalance,
        categoryId: account.categoryId,
        typeId: account.typeId,
        currencyCode: account.currencyCode,
        icon: account.icon
      })
    }
  }, [open, isEdit, account, reset])

  const onSubmit = async (data: ICreateAccount) => {
    try {
      if (isEdit && account) {
        await updateAccount({ id: account.id, data })
      } else {
        await createAccount(data)
      }

      setOpen(false)
      reset()
    } catch {
      // toast показывается в useAccounts
    }
  }

  const selectedIcon = watch('icon')

  const isLoading = isCreating || isUpdating || isDeleting

  const preventMinus: React.KeyboardEventHandler<HTMLInputElement> = e => {
    if (
      e.code === 'Minus' ||
      e.key === '-' ||
      e.key === 'e' ||
      e.key === 'E' ||
      e.key === '+'
    ) {
      e.preventDefault()
    }
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
            className="w-full justify-center cursor-pointer hover:[&_svg]:rotate-90 [&_svg]:transition-transform [&_svg]:duration-500"
          >
            <Plus className="size-5" />
            <span className="text-base">Добавить счёт</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-5xl xl:max-w-6xl p-0 max-h-[90vh] overflow-y-auto">
        <GlassCard className="rounded-3xl p-10 md:p-14 shadow-2xl text-xl transition-all duration-700">
          <DialogHeader className="mb-8">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                {isEdit ? 'Редактировать счёт' : 'Новый счёт'}
              </DialogTitle>

              {isEdit && account && (
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
            className="space-y-6"
          >
            {/* Название и баланс */}
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <Label className="text-lg font-medium">Название</Label>
                <Input
                  placeholder="Тинькофф Black"
                  className="h-14 text-xl px-6"
                  {...register('name', { required: 'Обязательное поле' })}
                />
                {errors.name && (
                  <p className="text-destructive text-sm">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-medium">Баланс</Label>
                <NumericFormat
                  // Базовые настройки отображения
                  thousandSeparator=" "
                  decimalScale={2}
                  allowNegative={false}
                  placeholder="0.00"
                  // Интеграция со стилями Shadcn
                  customInput={Input}
                  className="h-14 text-lg px-6"
                  // Интеграция с react-hook-form
                  onValueChange={values => {
                    // Сохраняем в форму чистое число (number), а не строку с пробелами
                    setValue('currentBalance', values.floatValue || 0)
                  }}
                  // Передаем значение из формы обратно для визуализации
                  value={watch('currentBalance')}
                />
                {errors.currentBalance && (
                  <p className="text-destructive text-sm">
                    {errors.currentBalance.message}
                  </p>
                )}
              </div>
            </div>

            {/* Категория / Тип / Валюта */}
            <div className="grid gap-8 md:grid-cols-3">
              <Select
                value={watch('categoryId')?.toString()}
                onValueChange={v =>
                  setValue('categoryId', Number(v) as AccountCategoryEnum)
                }
              >
                <SelectTrigger className="text-xl p-6 w-1xs bg-background border rounded-xl">
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent className="bg-background w-2xs backdrop-blur-none border shadow-xl rounded-xl text-xl">
                  <SelectItem value="1">Счёт</SelectItem>
                  <SelectItem value="2">Сберегательный</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={watch('typeId')?.toString()}
                onValueChange={v =>
                  setValue('typeId', Number(v) as AccountTypeEnum)
                }
              >
                <SelectTrigger className="text-xl p-6 w-1xs bg-background border rounded-xl">
                  <SelectValue placeholder="Тип" />
                </SelectTrigger>
                <SelectContent className="bg-background w-2xs backdrop-blur-none border shadow-xl rounded-xl text-xl">
                  <SelectItem value="1">Наличные</SelectItem>
                  <SelectItem value="2">Карта</SelectItem>
                  <SelectItem value="3">Крипто</SelectItem>
                  <SelectItem value="4">Накопительный</SelectItem>
                  <SelectItem value="5">Депозит</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={watch('currencyCode')}
                disabled={isEdit}
                onValueChange={v => setValue('currencyCode', v as CurrencyCode)}
              >
                <SelectTrigger className="text-xl p-6 w-1xs bg-background border rounded-xl">
                  <SelectValue placeholder="Валюта" />
                </SelectTrigger>
                <SelectContent className="bg-background w-2xs backdrop-blur-none border shadow-xl rounded-xl text-xl">
                  <SelectItem value={CurrencyCode.RUB}>₽ Рубль</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Иконки */}
            <ScrollArea className="h-64 rounded-xl border bg-background/50">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 p-4">
                {iconOptions.map(icon => {
                  const Icon = AccountIcons[icon]
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
                disabled={isLoading}
                className="h-14 sm:flex-1"
              >
                {isEdit ? 'Сохранить' : 'Создать'}
              </AccentButton>

              <AccentButton
                type="button"
                variant="ghost"
                size="lg"
                className="h-14 sm:flex-1"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Отмена
              </AccentButton>
            </div>

            <ConfirmAlert
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Удалить счёт?"
              description={
                <>
                  Счёт <b>«{account?.name}»</b> будет удалён навсегда.
                  <br />
                  Это действие нельзя отменить.
                </>
              }
              confirmText="Удалить"
              cancelText="Отмена"
              loading={isDeleting}
              onConfirm={handleDelete}
            />
          </form>
        </GlassCard>
      </DialogContent>
    </Dialog>
  )
}
