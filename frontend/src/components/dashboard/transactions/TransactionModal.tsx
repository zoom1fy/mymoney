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
  Wallet
} from 'lucide-react'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'

import { AccentButton } from '@/components/ui/buttons/accent-button'
import { GlassCard } from '@/components/ui/cards/glass-card'
import { ModalHeader } from '@/components/ui/modal/modal-header'
import { Button } from '@/components/ui/shadui/button'
import { Calendar } from '@/components/ui/shadui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
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

import { CurrencyCode, IAccount } from '@/types/account.types'
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
const FIELD_CLASSES_DISABLED =
  '!h-14 w-full text-xl px-6 rounded-xl bg-muted border-2 opacity-70 cursor-not-allowed'
const CONTAINER_CLASSES = 'w-full space-y-3'

function normalizeDate(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

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
  const { accounts, isLoading: accountsLoading, useAccountById } = useAccounts()
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
      date: normalizeDate(new Date())
    }
  })

  useEffect(() => {
    if (isEdit && transaction) {
      reset({
        amount: transaction.amount,
        description: transaction.description || '',
        accountId: String(transaction.accountId),
        date: normalizeDate(new Date(transaction.transactionDate))
      })
    }
  }, [isEdit, transaction, reset])

  // Смотрим id из формы
  const accountId = watch('accountId')

  // Если локально не нашли — делаем запрос findOne
  const { data: remoteAccount } = useAccountById(
    accountId && !accounts.find(a => a.id === Number(accountId))
      ? Number(accountId)
      : undefined
  )

  const selectedAccount = useMemo<IAccount | undefined>(() => {
    if (accountsLoading) return undefined
    if (!accountId) return undefined

    const local = accounts.find(a => a.id === Number(accountId))
    return local || remoteAccount || undefined
  }, [accounts, accountsLoading, accountId, remoteAccount])

  // Проверяем, заблокирована ли форма (только для редактирования и если счёт удалён)
  const isFormDisabled = isEdit && selectedAccount?.isDeleted === true

  const onSubmit = async (data: ITransactionForm) => {
    // Дополнительная защита от отправки формы с удалённым счётом
    if (isFormDisabled) return

    const payload = {
      accountId: Number(data.accountId),
      categoryId: category.id,
      amount: Number(data.amount),
      description: data.description.trim() || undefined,
      type: transactionType,
      currencyCode: CurrencyCode.RUB,
      transactionDate: new Date(
        Date.UTC(
          data.date.getFullYear(),
          data.date.getMonth(),
          data.date.getDate()
        )
      ).toISOString()
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
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] max-w-5xl xl:max-w-6xl p-0 max-h-[90vh] overflow-y-auto"
      >
        <GlassCard className="rounded-3xl p-10 md:p-14 shadow-2xl text-xl transition-all duration-700">
          <DialogHeader className="mb-8">
            <ModalHeader
              icon={<Wallet className="size-6 text-white" />}
              title={
                isEdit
                  ? `Редактировать ${isExpense ? 'расход' : 'доход'}`
                  : `Новый ${isExpense ? 'расход' : 'доход'}`
              }
              onClose={() => onOpenChange?.(false)}
              onDelete={() => setConfirmOpen(true)}
              isDeleteLoading={isDeleting}
              showDelete={isEdit}
            />
          </DialogHeader>

          <TransactionPreview
            amount={watch('amount')}
            date={watch('date')}
            category={category}
            isExpense={isExpense}
            selectedAccount={selectedAccount}
            originalTransaction={transaction} // Передаём исходную транзакцию
            isEditMode={isEdit} // Передаём флаг режима редактирования
          />

          {/* Показываем предупреждение, если счёт удалён */}
          {isFormDisabled && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
              <p className="text-center font-medium">
                ⚠️ Этот счёт был удалён. Редактирование недоступно.
              </p>
            </div>
          )}

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
                        disabled={isFormDisabled}
                        className={cn(
                          isFormDisabled
                            ? FIELD_CLASSES_DISABLED
                            : FIELD_CLASSES,
                          'text-2xl font-bold border-2 focus-visible:ring-offset-0',
                          errors.amount &&
                            !isFormDisabled &&
                            'border-destructive'
                        )}
                        onValueChange={values =>
                          !isFormDisabled &&
                          field.onChange(values.floatValue ?? '')
                        }
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
                  <Controller
                    control={control}
                    name="accountId"
                    rules={{ required: 'Выберите счёт' }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={val => {
                          if (isFormDisabled) return
                          const acc = accounts.find(a => a.id === Number(val))
                          if (acc?.isDeleted) return
                          field.onChange(val)
                        }}
                        disabled={isFormDisabled}
                      >
                        <SelectTrigger
                          className={cn(
                            isFormDisabled
                              ? FIELD_CLASSES_DISABLED
                              : FIELD_CLASSES,
                            'cursor-pointer'
                          )}
                        >
                          <SelectValue placeholder="Выберите счёт" />
                        </SelectTrigger>

                        <SelectContent className="rounded-xl bg-background">
                          {/* Показываем только активные счета */}
                          {accounts
                            .filter(acc => !acc.isDeleted)
                            .map(acc => (
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

                          {/* Если нет активных счетов */}
                          {accounts.filter(acc => !acc.isDeleted).length ===
                            0 && (
                            <div className="text-center py-6 text-muted-foreground">
                              Нет доступных счетов
                            </div>
                          )}
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
                    <PopoverTrigger
                      asChild
                      disabled={isFormDisabled}
                    >
                      <Button
                        variant="outline"
                        disabled={isFormDisabled}
                        className={cn(
                          isFormDisabled
                            ? FIELD_CLASSES_DISABLED
                            : FIELD_CLASSES,
                          'justify-start font-normal text-left cursor-pointer'
                        )}
                      >
                        <span className="truncate">
                          {format(watch('date'), 'd MMMM yyyy', { locale: ru })}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    {!isFormDisabled && (
                      <PopoverContent
                        className="w-auto p-0 border border-border bg-card shadow-2xl rounded-2xl"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={watch('date')}
                          onSelect={d =>
                            d &&
                            setValue('date', normalizeDate(d), {
                              shouldValidate: true
                            })
                          }
                          locale={ru as any}
                          className="p-3"
                        />
                      </PopoverContent>
                    )}
                  </Popover>
                </div>

                <div className={CONTAINER_CLASSES}>
                  <Label className="text-lg font-medium ml-1 flex items-center gap-2">
                    <FileText className="size-5 opacity-70" /> Заметка
                  </Label>
                  <Input
                    placeholder="На что потратили?"
                    disabled={isFormDisabled}
                    className={cn(
                      isFormDisabled ? FIELD_CLASSES_DISABLED : FIELD_CLASSES
                    )}
                    {...register('description')}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6 pt-4">
              <AccentButton
                type="submit"
                disabled={!isValid || isLoading || isFormDisabled}
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
