'use client'

import { ConfirmAlert } from '../../ui/dialogs/confirm-alert'
import { TransactionPreview } from './TransactionPreview'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  Calendar as CalendarIcon,
  FileText,
  Loader2,
  Trash2,
  Wallet
} from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'

import { AccentButton } from '@/components/ui/buttons/accent-button'
import { GlassCard } from '@/components/ui/cards/glass-card'
import { Button } from '@/components/ui/shadui/button'
import { Calendar } from '@/components/ui/shadui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/shadui/dialog'
import { Input } from '@/components/ui/shadui/input'
import { Label } from '@/components/ui/shadui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/shadui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadui/select'

import { CurrencyCode } from '@/types/account.types'
import { ICategory } from '@/types/category.types'
import { ITransaction, TransactionType } from '@/types/transaction.types'

import { useAccounts } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'

interface ITransactionForm {
  amount: number | ''
  description: string
  accountId: string
  date: Date
}

interface Props {
  mode?: 'create' | 'edit'
  transaction?: ITransaction
  category: ICategory
  isExpense: boolean
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const FIELD_CLASSES =
  '!h-14 w-full text-xl px-6 rounded-xl bg-background border-2'
const CONTAINER_CLASSES = 'w-full space-y-3'

export function TransactionModal({
  mode = 'create',
  transaction,
  category,
  isExpense,
  trigger,
  open,
  onOpenChange
}: Props) {
  const isEdit = mode === 'edit'
  const { accounts } = useAccounts()
  const {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isCreating,
    isUpdating,
    isDeleting
  } = useTransactions()

  const [confirmOpen, setConfirmOpen] = useState(false)

  const transactionType = isExpense
    ? TransactionType.EXPENSE
    : TransactionType.INCOME

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors, isValid }
  } = useForm<ITransactionForm>({
    mode: 'onChange',
    defaultValues: {
      amount: '',
      description: '',
      accountId: '',
      date: new Date()
    }
  })

  useEffect(() => {
    if (isEdit && transaction) {
      reset({
        amount: transaction.amount,
        description: transaction.description || '',
        accountId: String(transaction.accountId),
        date: new Date(transaction.transactionDate)
      })
    }
  }, [isEdit, transaction, reset])

  const selectedAccount = accounts.find(
    acc => String(acc.id) === watch('accountId')
  )
  const onSubmit = async (data: ITransactionForm) => {
    const payload = {
      accountId: Number(data.accountId),
      categoryId: category.id,
      amount: Number(data.amount),
      description: data.description.trim() || undefined,
      type: transactionType,
      currencyCode: CurrencyCode.RUB,
      transactionDate: data.date.toISOString()
    }

    try {
      if (isEdit && transaction) {
        await updateTransaction({
          id: transaction.id,
          data: payload
        })
      } else {
        await createTransaction(payload)
      }

      onOpenChange?.(false)
      reset()
    } catch {}
  }

  const handleDelete = async () => {
    if (!transaction) return

    await deleteTransaction(transaction.id)
    setConfirmOpen(false)
    onOpenChange?.(false)
  }

  const isLoading = isCreating || isUpdating || isDeleting

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="w-[95vw] max-w-5xl xl:max-w-6xl p-0 max-h-[90vh] overflow-y-auto">
        <GlassCard className="rounded-3xl p-10 md:p-14 shadow-2xl text-xl transition-all duration-700">
          <DialogHeader className="mb-8">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-3xl font-bold tracking-tight">
                {isEdit
                  ? `Редактировать ${isExpense ? 'расход' : 'доход'}`
                  : `Новый ${isExpense ? 'расход' : 'доход'}`}
              </DialogTitle>

              {isEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmOpen(true)}
                  disabled={isLoading}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-5" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <TransactionPreview
            amount={watch('amount')}
            date={watch('date')}
            category={category}
            isExpense={isExpense}
            selectedAccount={selectedAccount}
          />

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {/* Левая колонка */}
              <div className="space-y-8">
                <div className={CONTAINER_CLASSES}>
                  <Label className="text-lg font-medium ml-1">Сумма</Label>
                  <Controller
                    control={control}
                    name="amount"
                    rules={{ required: 'Введите сумму' }}
                    render={({ field }) => (
                      <NumericFormat
                        thousandSeparator=" "
                        decimalScale={2}
                        decimalSeparator=","
                        allowNegative={false}
                        placeholder="0,00"
                        customInput={Input}
                        value={field.value}
                        className={cn(
                          FIELD_CLASSES,
                          'text-2xl font-bold border-2 focus-visible:ring-offset-0',
                          errors.amount && 'border-destructive'
                        )}
                        onValueChange={values =>
                          field.onChange(values.floatValue ?? '')
                        }
                        // Добавил ваше ограничение на 10 цифр
                        isAllowed={values => {
                          const digits = values.value.replace(/\D/g, '')
                          return digits.length <= 10
                        }}
                      />
                    )}
                  />
                </div>

                <div className={CONTAINER_CLASSES}>
                  <Label className="text-lg font-medium ml-1 flex items-center gap-2">
                    <Wallet className="size-5 opacity-70" /> Счёт
                  </Label>
                  {/* Оставил ваш контроллер для точности работы Select */}
                  <Controller
                    control={control}
                    name="accountId"
                    rules={{ required: 'Выберите счёт' }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className={cn(FIELD_CLASSES, 'cursor-pointer')}
                        >
                          <SelectValue placeholder="Выберите счёт" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-background">
                          {accounts.map(acc => (
                            <SelectItem
                              key={acc.id}
                              value={String(acc.id)}
                              className="text-lg py-3 cursor-pointer"
                            >
                              <div className="flex items-center justify-between w-full gap-4">
                                <span>{acc.name}</span>
                                <span className="text-muted-foreground font-medium">
                                  {acc.currentBalance.toLocaleString('ru-RU')}{' '}
                                  {acc.currencyCode}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {/* Правая колонка */}
              <div className="space-y-8">
                <div className={CONTAINER_CLASSES}>
                  <Label className="text-lg font-medium ml-1 flex items-center gap-2">
                    <CalendarIcon className="size-5 opacity-70" /> Дата
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          FIELD_CLASSES,
                          'justify-start font-normal text-left cursor-pointer'
                        )}
                      >
                        <span className="truncate">
                          {format(watch('date'), 'd MMMM yyyy', { locale: ru })}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 border border-border bg-card shadow-2xl rounded-2xl"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={watch('date')}
                        onSelect={d =>
                          d && setValue('date', d, { shouldValidate: true })
                        }
                        locale={ru as any}
                        className="p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className={CONTAINER_CLASSES}>
                  <Label className="text-lg font-medium ml-1 flex items-center gap-2">
                    <FileText className="size-5 opacity-70" /> Заметка
                  </Label>
                  <Input
                    placeholder="На что потратили?"
                    className={FIELD_CLASSES}
                    {...register('description')}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6 pt-4">
              <AccentButton
                type="submit"
                disabled={!isValid || isLoading}
                className="h-14 sm:flex-1"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : isEdit ? (
                  'Сохранить'
                ) : (
                  'Добавить'
                )}
              </AccentButton>

              <AccentButton
                type="button"
                variant="outline"
                className="h-14 sm:flex-1"
                onClick={() => onOpenChange?.(false)}
                disabled={isLoading}
              >
                Отмена
              </AccentButton>
            </div>

            <ConfirmAlert
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Удалить транзакцию?"
              description="Это действие нельзя отменить."
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
