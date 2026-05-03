'use client'

import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowRight, HelpCircle } from 'lucide-react'

import { AccountIcons, IAccount } from '@/types/account.types'
import { CategoryIcons, ICategory } from '@/types/category.types'
import { ITransaction, TransactionType } from '@/types/transaction.types'

interface TransactionPreviewProps {
  amount: number | ''
  date: Date
  category: ICategory
  isExpense: boolean
  selectedAccount?: IAccount
  originalTransaction?: ITransaction
  isEditMode?: boolean
}

export function TransactionPreview({
  amount,
  date,
  category,
  isExpense,
  selectedAccount,
  originalTransaction,
  isEditMode = false
}: TransactionPreviewProps) {
  const AccountIcon = selectedAccount?.icon
    ? AccountIcons[selectedAccount.icon] || HelpCircle
    : HelpCircle

  const CategoryIcon = category?.icon
    ? CategoryIcons[category.icon] || HelpCircle
    : HelpCircle

  const finalAmount = Number(amount) || 0
  const isShowForecast = finalAmount > 0 && selectedAccount

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

  const getNewBalance = () => {
    if (!selectedAccount) return 0
    if (isEditMode && originalTransaction) {
      const isOriginalExpense =
        originalTransaction.type === TransactionType.EXPENSE
      const originalAmount = originalTransaction.amount
      let balanceAfterRollback = isOriginalExpense
        ? selectedAccount.currentBalance + originalAmount
        : selectedAccount.currentBalance - originalAmount
      return isExpense ? balanceAfterRollback - finalAmount : balanceAfterRollback + finalAmount
    }
    return isExpense
      ? selectedAccount.currentBalance - finalAmount
      : selectedAccount.currentBalance + finalAmount
  }

  const newBalance = getNewBalance()

  return (
    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 shadow-inner">
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Сумма и дата */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 shadow-sm"
          >
            <span className="text-xl font-bold text-primary tracking-tight">
              {finalAmount ? `${finalAmount.toLocaleString('ru-RU')} ₽` : '0 ₽'}
            </span>
          </motion.div>
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            {format(date, 'd MMMM yyyy', { locale: ru })}
          </p>
        </div>

        {/* Визуальный путь транзакции */}
        <div className="flex flex-col md:flex-row items-center justify-center space-y-3 md:space-y-0 md:space-x-6 w-full max-w-xl">
          {/* Блок счета */}
          <div className="flex flex-col items-center space-y-2 flex-1">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={cn(
                'size-16 rounded-xl flex items-center justify-center border-2 transition-all shadow-sm',
                selectedAccount
                  ? 'bg-background border-primary/40 shadow-primary/10'
                  : 'bg-muted/30 border-muted/40'
              )}
            >
              <AccountIcon
                className={cn(
                  'size-8',
                  selectedAccount ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            </motion.div>
            <p className="font-semibold text-sm whitespace-nowrap">
              {selectedAccount?.name || 'Счёт не выбран'}
            </p>
          </div>

          {/* Направление (Стрелка) */}
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

          {/* Блок категории */}
          <div className="flex flex-col items-center space-y-2 flex-1">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="size-16 rounded-xl flex items-center justify-center border-2 bg-background border-accent/40 shadow-sm"
            >
              <CategoryIcon className="size-8 text-primary" />
            </motion.div>
            <p className="font-semibold text-sm whitespace-nowrap">
              {category.name}
            </p>
          </div>
        </div>

        {/* Прогноз баланса */}
        <AnimatePresence mode="wait">
          {isShowForecast && (
            <motion.div
              key="forecast"
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: 100 }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 20,
                mass: 0.8
              }}
              className="overflow-hidden w-full md:w-auto"
            >
              <div className="mt-2 p-4 rounded-xl bg-background/80 backdrop-blur-sm border border-border shadow-xl">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                      {isEditMode ? 'Было до правок' : 'Было'}
                    </p>
                    <p className="text-base font-bold opacity-80">
                      {originalBalance.toLocaleString('ru-RU')} ₽
                    </p>
                    {isEditMode && originalTransaction && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        (без учёта старой транзакции)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center text-muted-foreground/50">
                    <ArrowRight className="size-4 hidden md:block" />
                    <ArrowDown className="size-4 md:hidden" />
                  </div>

                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                      Станет
                    </p>
                    <motion.p
                      key={newBalance}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        'text-lg font-black',
                        newBalance < originalBalance
                          ? 'text-destructive'
                          : 'text-success'
                      )}
                    >
                      {newBalance.toLocaleString('ru-RU')} ₽
                    </motion.p>
                    {isEditMode &&
                      finalAmount !== originalTransaction?.amount && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          изменение:{' '}
                          {newBalance - originalBalance > 0 ? '+' : ''}
                          {(newBalance - originalBalance).toLocaleString(
                            'ru-RU'
                          )}{' '}
                          ₽
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