'use client'

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowRight, HelpCircle } from 'lucide-react'
import { useRef } from 'react'

import { AnimatedConnection } from './animated-connection'

import { accountIcons, IAccount } from '@/types/account.type'
import { categoryIcons, ICategory } from '@/types/category.type'
import { ITransaction, TransactionType } from '@/types/transaction.type'

import { cn } from '@/lib/cn'

interface TransactionPreviewProps {
  amount: number | ''
  date: Date
  category: ICategory
  isExpense: boolean
  selectedAccount?: IAccount
  originalTransaction?: ITransaction
  isEditMode?: boolean
  isSidebar?: boolean
}

export function TransactionPreview({
  amount,
  date,
  category,
  isExpense,
  selectedAccount,
  originalTransaction,
  isEditMode = false,
  isSidebar = false
}: TransactionPreviewProps) {
  const accountNodeRef = useRef<HTMLDivElement>(null)
  const categoryNodeRef = useRef<HTMLDivElement>(null)

  const AccountIcon = selectedAccount?.icon
    ? accountIcons[selectedAccount.icon] || HelpCircle
    : HelpCircle

  const CategoryIcon = category?.icon
    ? categoryIcons[category.icon] || HelpCircle
    : HelpCircle

  const currencySymbol = selectedAccount?.currencySymbol || '₽'

  const finalAmount = Number(amount) || 0
  const isShowForecast = finalAmount > 0 && selectedAccount

  // The current balance already includes the edited transaction, so undo it first to show the pre-edit state
  const getOriginalBalance = () => {
    if (!selectedAccount) return 0
    if (isEditMode && originalTransaction) {
      const isOriginalExpense =
        originalTransaction.type === TransactionType.EXPENSE
      const originalAmount = originalTransaction.amount
      return isOriginalExpense
        ? selectedAccount.currentBalance + originalAmount
        : selectedAccount.currentBalance - originalAmount
    }
    return selectedAccount.currentBalance
  }

  const originalBalance = getOriginalBalance()

  // Roll the original transaction back, then apply the newly entered amount for the forecast
  const getNewBalance = () => {
    if (!selectedAccount) return 0
    if (isEditMode && originalTransaction) {
      const isOriginalExpense =
        originalTransaction.type === TransactionType.EXPENSE
      const originalAmount = originalTransaction.amount
      const balanceAfterRollback = isOriginalExpense
        ? selectedAccount.currentBalance + originalAmount
        : selectedAccount.currentBalance - originalAmount
      return isExpense
        ? balanceAfterRollback - finalAmount
        : balanceAfterRollback + finalAmount
    }
    return isExpense
      ? selectedAccount.currentBalance - finalAmount
      : selectedAccount.currentBalance + finalAmount
  }

  const newBalance = getNewBalance()

  if (isSidebar) {
    return (
      <div className="h-full p-7 rounded-xl bg-card border flex flex-col items-center text-center gap-6">
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'text-5xl font-black tracking-tight leading-none',
            isExpense ? 'text-red-500' : 'text-emerald-500'
          )}
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18 }}
        >
          {isExpense ? '−' : '+'}
          {finalAmount.toLocaleString('ru-RU')} {currencySymbol}
        </motion.p>

        <p className="text-base text-muted-foreground">
          {category.name} • {format(date, 'd MMMM yyyy', { locale: ru })}
        </p>

        <div className="w-full group px-6">
          <div className="relative flex justify-between items-start">
            <AnimatedConnection
              className="absolute inset-0"
              fromEdge={isExpense ? 'right' : 'left'}
              fromRef={isExpense ? accountNodeRef : categoryNodeRef}
              morphKey={category.id}
              toEdge={isExpense ? 'left' : 'right'}
              toRef={isExpense ? categoryNodeRef : accountNodeRef}
            />
            <div className="flex w-28 flex-col items-center gap-2.5">
              <div
                className="size-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.12)]"
                ref={accountNodeRef}
              >
                <AccountIcon className="size-8" />
              </div>
              <span className="w-full text-base font-semibold truncate">
                {selectedAccount?.name || 'Счёт'}
              </span>
            </div>
            <div className="flex w-28 flex-col items-center gap-2.5">
              <div
                className="size-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.12)]"
                ref={categoryNodeRef}
              >
                <CategoryIcon className="size-8" />
              </div>
              <span className="w-full text-base font-semibold truncate">
                {category.name}
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isShowForecast && (
            <motion.div
              layout
              animate={{ opacity: 1 }}
              className="w-full space-y-3 border-t pt-4"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
            >
              <p className="text-lg font-semibold text-left">
                {isEditMode ? 'Баланс до правок' : 'После операции'}
              </p>
              <div className="flex justify-between">
                <div className="text-left">
                  <p className="text-sm text-muted-foreground leading-none">
                    Было
                  </p>
                  <p className="text-lg font-semibold mt-1.5">
                    {originalBalance.toLocaleString('ru-RU')} {currencySymbol}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground leading-none">
                    Станет
                  </p>
                  <p
                    className={cn(
                      'text-lg font-black mt-1.5',
                      newBalance < originalBalance
                        ? 'text-red-500'
                        : 'text-emerald-500'
                    )}
                  >
                    {newBalance.toLocaleString('ru-RU')} {currencySymbol}
                  </p>
                </div>
              </div>
              {isEditMode && finalAmount !== originalTransaction?.amount && (
                <p className="text-xs text-muted-foreground text-left">
                  Изменение: {newBalance - originalBalance > 0 ? '+' : ''}
                  {(newBalance - originalBalance).toLocaleString('ru-RU')}{' '}
                  {currencySymbol}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="mb-6 p-4 rounded-2xl bg-linear-to-br from-muted/30 to-muted/10 border border-border/50 shadow-inner">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <motion.div
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 shadow-sm"
            initial={{ scale: 0.9, opacity: 0 }}
          >
            <span className="text-xl font-bold text-primary tracking-tight">
              {finalAmount ? `${finalAmount.toLocaleString('ru-RU')} ${currencySymbol}` : `0 ${currencySymbol}`}
            </span>
          </motion.div>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">
            {format(date, 'd MMMM yyyy', { locale: ru })}
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 w-full max-w-xl">
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <motion.div
              className={cn(
                'size-16 rounded-xl flex items-center justify-center border-2 transition-all shadow-sm',
                selectedAccount
                  ? 'bg-background border-primary/40 shadow-primary/10'
                  : 'bg-muted/30 border-muted/40'
              )}
              whileHover={{ scale: 1.05 }}
            >
              <AccountIcon
                className={cn('size-8', selectedAccount ? 'text-primary' : 'text-muted-foreground')}
              />
            </motion.div>
            <p className="font-semibold text-sm whitespace-nowrap">
              {selectedAccount?.name || 'Счёт не выбран'}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="p-2 rounded-full bg-background border border-border shadow-sm">
              <ArrowRight
                className={cn(
                  'size-6 transition-all duration-500 ease-in-out',
                  isExpense
                    ? 'text-destructive rotate-90 md:rotate-0'
                    : 'text-success -rotate-90 md:rotate-180'
                )}
              />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-1">
              {isExpense ? 'Расход' : 'Доход'}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5 flex-1">
            <motion.div
              className="size-16 rounded-xl flex items-center justify-center border-2 bg-background border-accent/40 shadow-sm"
              whileHover={{ scale: 1.05 }}
            >
              <CategoryIcon className="size-8 text-primary" />
            </motion.div>
            <p className="font-semibold text-sm whitespace-nowrap">
              {category.name}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isShowForecast && (
            <motion.div
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              className="overflow-hidden w-full md:w-auto"
              exit={{ height: 0, opacity: 0, y: 100 }}
              initial={{ height: 0, opacity: 0, y: -10 }}
              key="forecast"
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 20,
                mass: 0.8
              }}
            >
                <div className="mt-1 p-4 rounded-xl bg-background/80 backdrop-blur-sm border border-border shadow-xl">
                <div className="flex items-center justify-center gap-3">
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">
                      {isEditMode ? 'Было до правок' : 'Было'}
                    </p>
                    <p className="text-sm font-bold opacity-80">
                      {originalBalance.toLocaleString('ru-RU')} {currencySymbol}
                    </p>
                    {isEditMode && originalTransaction && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        (без учёта старой транзакции)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center text-muted-foreground/50">
                    <ArrowRight className="size-3.5 hidden md:block" />
                    <ArrowDown className="size-3.5 md:hidden" />
                  </div>

                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">
                      Станет
                    </p>
                    <motion.p
                      animate={{ scale: 1 }}
                      className={cn(
                        'text-base font-black',
                        newBalance < originalBalance
                          ? 'text-destructive'
                          : 'text-success'
                      )}
                      initial={{ scale: 1.1 }}
                      key={newBalance}
                    >
                      {newBalance.toLocaleString('ru-RU')} {currencySymbol}
                    </motion.p>
                    {isEditMode &&
                      finalAmount !== originalTransaction?.amount && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          изменение:{' '}
                          {newBalance - originalBalance > 0 ? '+' : ''}
                          {(newBalance - originalBalance).toLocaleString('ru-RU')} {currencySymbol}
                        </p>
                      )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
