'use client'

import { TransactionPreview } from './TransactionPreview'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  ArrowRight,
  Calendar as CalendarIcon,
  FileText,
  HelpCircle,
  Loader2,
  Wallet
} from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { toast } from 'sonner'

import { AccentButton } from '@/components/ui/buttons/accent-button'
import { GlassCard } from '@/components/ui/cards/glass-card'
import { Button } from '@/components/ui/shadui/button'
import { Calendar } from '@/components/ui/shadui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
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
// Импортируем иконки счетов из вашего Sidebar
import { AccountIcons } from '@/types/account.types'
import { CategoryIcons, ICategory } from '@/types/category.types'
// Импортируем CategoryIcons
import { TransactionType } from '@/types/transaction.types'

import { useAccounts } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'

// Типизация формы
interface ITransactionForm {
  amount: number | ''
  description: string
  accountId: string
  date: Date
}

interface Props {
  open: boolean
  onClose: () => void
  category: ICategory
  isExpense: boolean
}

const FIELD_CLASSES =
  '!h-14 w-full text-xl px-6 rounded-xl bg-background border-2'
const CONTAINER_CLASSES = 'w-full space-y-3'

export function CreateTransactionModal({
  open,
  onClose,
  category,
  isExpense
}: Props) {
  const { accounts, isLoading: accountsLoading } = useAccounts()
  const transactionType = isExpense
    ? TransactionType.EXPENSE
    : TransactionType.INCOME
  const { createTransaction, isCreating } = useTransactions()

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

  const date = watch('date')
  const accountId = watch('accountId')
  const amount = watch('amount')

  // Находим выбранный счет
  const selectedAccount = accounts.find(acc => String(acc.id) === accountId)

  // Получаем компонент иконки для счета
  const getAccountIcon = () => {
    if (!selectedAccount?.icon) return HelpCircle
    return AccountIcons[selectedAccount.icon] || HelpCircle
  }

  // Получаем компонент иконки для категории
  const getCategoryIcon = () => {
    if (!category?.icon) return HelpCircle
    return CategoryIcons[category.icon] || HelpCircle
  }

  // Сбрасываем форму при открытии
  useEffect(() => {
    if (open) {
      reset({
        amount: '',
        description: '',
        accountId: '',
        date: new Date()
      })
    }
  }, [open, reset])

  // Обработка отправки формы
  const onSubmit = async (data: ITransactionForm) => {
    try {
      await createTransaction({
        accountId: Number(data.accountId),
        categoryId: category.id,
        amount: Number(data.amount),
        description: data.description.trim() || undefined,
        type: transactionType,
        currencyCode: CurrencyCode.RUB,
        transactionDate: data.date.toISOString()
      })
      onClose()
    } catch (err) {
      console.error('Ошибка при создании транзакции:', err)
    }
  }

  const AccountIcon = getAccountIcon()
  const CategoryIcon = getCategoryIcon()

  return (
    <Dialog
      open={open}
      onOpenChange={v => !v && onClose()}
    >
      <DialogContent className="w-[95vw] max-w-5xl xl:max-w-6xl p-0 max-h-[90vh] overflow-y-auto">
        <GlassCard className="rounded-3xl p-10 md:p-14 shadow-2xl text-xl transition-all duration-700">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-bold tracking-tight">
              Добавить {isExpense ? 'расход' : 'доход'}
            </DialogTitle>
          </DialogHeader>

          {/* Блок предпросмотра транзакции */}
          <TransactionPreview
            amount={amount}
            date={date}
            category={category}
            isExpense={isExpense}
            selectedAccount={selectedAccount}
          />

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Сетка 2х2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {/* Левая колонка */}
              <div className="space-y-8">
                {/* Поле сумма */}
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
                        isAllowed={values => {
                          const { value } = values // это строка без форматирования
                          // оставляем только цифры и ограничиваем длину до 10
                          const digits = value.replace(/\D/g, '')
                          return digits.length <= 10
                        }}
                      />
                    )}
                  />

                  {errors.amount && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.amount.message}
                    </p>
                  )}
                </div>

                {/* Поле счет */}
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
                        onValueChange={field.onChange}
                        disabled={accountsLoading}
                      >
                        <SelectTrigger
                          className={cn(
                            FIELD_CLASSES,
                            'flex items-center justify-between cursor-pointer',
                            errors.accountId && 'border-destructive'
                          )}
                        >
                          <SelectValue
                            placeholder={
                              accountsLoading ? 'Загрузка...' : 'Выберите счёт'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-background">
                          {accounts.map(acc => (
                            <SelectItem
                              key={acc.id}
                              value={String(acc.id)}
                              className="text-lg"
                            >
                              {acc.name} • {acc.currentBalance.toLocaleString()}{' '}
                              {acc.currencyCode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.accountId && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.accountId.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Правая колонка */}
              <div className="space-y-8">
                {/* Поле дата */}
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
                          {date
                            ? format(date, 'd MMMM yyyy', { locale: ru })
                            : 'Выберите дату'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 border border-border bg-card shadow-2xl rounded-2xl"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={d => d && setValue('date', d)}
                        locale={ru as any}
                        className="p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Поле заметка */}
                <div className={CONTAINER_CLASSES}>
                  <Label className="text-lg font-medium ml-1 flex items-center gap-2">
                    <FileText className="size-5 opacity-70" /> Заметка
                  </Label>
                  <Input
                    placeholder="На что потратили?"
                    className={cn(FIELD_CLASSES)}
                    {...register('description')}
                  />
                </div>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <AccentButton
                type="submit"
                size="lg"
                variant="outline"
                className="h-14 sm:flex-1"
                disabled={isCreating || !isValid}
              >
                {isCreating ? <Loader2 className="animate-spin" /> : `Добавить`}
              </AccentButton>

              <AccentButton
                type="button"
                variant="outline"
                className="h-14 sm:flex-1"
                onClick={onClose}
                disabled={isCreating}
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
