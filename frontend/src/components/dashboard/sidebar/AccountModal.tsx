'use client'

import { Pencil, Plus } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'

import { AccentButton } from '@/components/ui/buttons/accent-button'
import { GlassCard } from '@/components/ui/cards/glass-card'
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

import { cn } from '@/lib/utils'

import { ConfirmAlert } from '../../ui/dialogs/confirm-alert'

const iconOptions = Object.keys(AccountIcons) as AccountIconName[]

interface Props {
  mode?: 'create' | 'edit'
  account?: IAccount
  trigger?: ReactNode
}

const FIELD_CLASSES =
  '!h-14 w-full text-xl px-6 rounded-xl bg-background border-2'
const CONTAINER_CLASSES = 'w-full space-y-3'

export function AccountModal({ mode = 'create', account, trigger }: Props) {
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
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)

  const handleDelete = async () => {
    if (!account) return

    try {
      await deleteAccount(account.id)
      setConfirmOpen(false)
      setOpen(false)
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
    formState: { errors, isDirty }
  } = useForm<ICreateAccount>({
    defaultValues: {
      name: '',
      currentBalance: 0,
      categoryId: AccountCategoryEnum.ACCOUNTS,
      typeId: AccountTypeEnum.CARD,
      currencyCode: CurrencyCode.RUB
    }
  })

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

  const attemptClose = () => {
    if (isDirty) {
      setCloseConfirmOpen(true)
      return
    }
    setOpen(false)
  }

  const confirmClose = () => {
    setCloseConfirmOpen(false)
    setOpen(false)
  }

  const selectedIcon = watch('icon')
  const isLoading = isCreating || isUpdating || isDeleting

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
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            className="w-full justify-center cursor-pointer hover:[&_svg]:rotate-90 [&_svg]:transition-transform [&_svg]:duration-500"
            variant="outline"
          >
            <Plus className="size-5" />
            <span className="text-base">Добавить счёт</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="w-[95vw] max-w-5xl xl:max-w-6xl p-0 max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <GlassCard className="rounded-3xl p-10 md:p-14 shadow-2xl text-xl transition-all duration-700">
          <DialogHeader className="mb-8">
            <ModalHeader
              icon={
                isEdit ? (
                  <Pencil className="size-6 text-white" />
                ) : (
                  <Plus className="size-6 text-white" />
                )
              }
              isDeleteLoading={isDeleting}
              showDelete={isEdit && !!account}
              title={isEdit ? 'Редактирование счёта' : 'Создание нового счёта'}
              onClose={attemptClose}
              onDelete={() => setConfirmOpen(true)}
            />
          </DialogHeader>

          <form
            className="space-y-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Название и баланс */}
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <div className={CONTAINER_CLASSES}>
                  <Label className="text-lg font-medium ml-1">Название</Label>
                  <Input
                    className={cn(FIELD_CLASSES)}
                    placeholder="Зарплатная карта"
                    {...register('name', { required: 'Обязательное поле' })}
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm">
                      {errors.name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-medium">Баланс</Label>
                <NumericFormat
                  allowNegative={false}
                  className={cn(
                    FIELD_CLASSES,
                    'text-2xl font-bold border-2 focus-visible:ring-offset-0',
                    errors.currentBalance && 'border-destructive'
                  )}
                  customInput={Input}
                  decimalScale={2}
                  decimalSeparator=","
                  isAllowed={values => {
                    const { value } = values
                    const digits = value.replace(/\D/g, '')
                    return digits.length <= 10
                  }}
                  placeholder="0,00"
                  thousandSeparator=" "
                  value={watch('currentBalance')}
                  onValueChange={values => {
                    setValue('currentBalance', values.floatValue || 0)
                  }}
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
              <div className={CONTAINER_CLASSES}>
                <Select
                  value={watch('categoryId')?.toString()}
                  onValueChange={v =>
                    setValue('categoryId', Number(v) as AccountCategoryEnum)
                  }
                >
                  <SelectTrigger
                    className={cn(
                      FIELD_CLASSES,
                      'flex items-center justify-between cursor-pointer',
                      errors.categoryId && 'border-destructive'
                    )}
                  >
                    <SelectValue placeholder="Категория" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-background">
                    <SelectItem value="1">Счёт</SelectItem>
                    <SelectItem value="2">Сберегательный</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className={CONTAINER_CLASSES}>
                <Select
                  value={watch('typeId')?.toString()}
                  onValueChange={v =>
                    setValue('typeId', Number(v) as AccountTypeEnum)
                  }
                >
                  <SelectTrigger
                    className={cn(
                      FIELD_CLASSES,
                      'flex items-center justify-between cursor-pointer',
                      errors.typeId && 'border-destructive'
                    )}
                  >
                    <SelectValue placeholder="Тип" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-background">
                    <SelectItem value="1">Наличные</SelectItem>
                    <SelectItem value="2">Карта</SelectItem>
                    <SelectItem value="3">Крипто</SelectItem>
                    <SelectItem value="4">Накопительный</SelectItem>
                    <SelectItem value="5">Депозит</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className={CONTAINER_CLASSES}>
                <Select
                  disabled={isEdit}
                  value={watch('currencyCode')}
                  onValueChange={v =>
                    setValue('currencyCode', v as CurrencyCode)
                  }
                >
                  <SelectTrigger
                    className={cn(
                      FIELD_CLASSES,
                      'flex items-center justify-between cursor-pointer',
                      errors.currencyCode && 'border-destructive'
                    )}
                  >
                    <SelectValue placeholder="Валюта" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-background">
                    <SelectItem value={CurrencyCode.RUB}>₽ Рубль</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Иконки */}
            <ScrollArea className="h-64 rounded-xl border bg-background/50">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 p-4">
                {iconOptions.map(icon => {
                  const Icon = AccountIcons[icon]
                  const active = selectedIcon === icon

                  return (
                    <button
                      className={cn(
                        'flex size-16 items-center justify-center rounded-xl border-2 transition-all cursor-pointer',
                        active
                          ? 'border-accent bg-accent/20 shadow-xl scale-110'
                          : 'border-transparent hover:border-accent/50 hover:bg-accent/10 hover:scale-105'
                      )}
                      key={icon}
                      type="button"
                      onClick={() => setValue('icon', icon)}
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
                className="h-14 sm:flex-1"
                disabled={isLoading}
                size="lg"
                type="submit"
                variant="outline"
              >
                {isEdit ? 'Сохранить' : 'Создать'}
              </AccentButton>

              <AccentButton
                className="h-14 sm:flex-1"
                disabled={isLoading}
                size="lg"
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Отмена
              </AccentButton>
            </div>

            <ConfirmAlert
              cancelText="Отмена"
              confirmText="Удалить"
              description={
                <>
                  Счёт <b>«{account?.name}»</b> будет удалён навсегда.
                  <br />
                  Это действие нельзя отменить.
                </>
              }
              loading={isDeleting}
              open={confirmOpen}
              title="Удалить счёт?"
              onConfirm={handleDelete}
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
          </form>
        </GlassCard>
      </DialogContent>
    </Dialog>
  )
}
