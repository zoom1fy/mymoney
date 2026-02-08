'use client'

import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowRight, HelpCircle } from 'lucide-react'

// Импортируем анимации

import { AccountIcons, IAccount } from '@/types/account.types'
import { CategoryIcons, ICategory } from '@/types/category.types'

interface TransactionPreviewProps {
  amount: number | ''
  date: Date
  category: ICategory
  isExpense: boolean
  selectedAccount?: IAccount
}

export function TransactionPreview({
  amount,
  date,
  category,
  isExpense,
  selectedAccount
}: TransactionPreviewProps) {
  const AccountIcon = selectedAccount?.icon
    ? AccountIcons[selectedAccount.icon] || HelpCircle
    : HelpCircle

  const CategoryIcon = category?.icon
    ? CategoryIcons[category.icon] || HelpCircle
    : HelpCircle

  const finalAmount = Number(amount) || 0
  const isShowForecast = finalAmount > 0 && selectedAccount

  return (
    <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 shadow-inner">
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Сумма и дата */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-sm"
          >
            <span className="text-2xl font-bold text-primary tracking-tight">
              {finalAmount ? `${finalAmount.toLocaleString('ru-RU')} ₽` : '0 ₽'}
            </span>
          </motion.div>
          <p className="text-sm text-muted-foreground mt-3 font-medium">
            {format(date, 'd MMMM yyyy', { locale: ru })}
          </p>
        </div>

        {/* Визуальный путь транзакции */}
        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-12 w-full max-w-2xl">
          {/* Блок счета */}
          <div className="flex flex-col items-center space-y-3 flex-1">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={cn(
                'size-20 rounded-2xl flex items-center justify-center border-2 transition-all shadow-sm',
                selectedAccount
                  ? 'bg-background border-primary/40 shadow-primary/10'
                  : 'bg-muted/30 border-muted/40'
              )}
            >
              <AccountIcon
                className={cn(
                  'size-10',
                  selectedAccount ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            </motion.div>
            <p className="font-semibold text-base whitespace-nowrap">
              {selectedAccount?.name || 'Счёт не выбран'}
            </p>
          </div>

          {/* Направление (Стрелка) */}
          <div className="flex flex-col items-center justify-center">
            <div className="p-3 rounded-full bg-background border border-border shadow-sm">
              <ArrowRight
                className={cn(
                  'size-7 transition-all duration-500 ease-in-out',
                  isExpense
                    ? 'text-destructive rotate-90 md:rotate-0'
                    : 'text-success -rotate-90 md:rotate-180'
                )}
              />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-2">
              {isExpense ? 'Расход' : 'Доход'}
            </span>
          </div>

          {/* Блок категории */}
          <div className="flex flex-col items-center space-y-3 flex-1">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="size-20 rounded-2xl flex items-center justify-center border-2 bg-background border-accent/40 shadow-sm"
            >
              <CategoryIcon className="size-10 text-primary" />
            </motion.div>
            <p className="font-semibold text-base whitespace-nowrap">
              {category.name}
            </p>
          </div>
        </div>

        {/* Прогноз баланса с анимацией появления */}
        <AnimatePresence mode="wait">
          {isShowForecast && (
            <motion.div
              key="forecast"
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="overflow-hidden w-full md:w-auto"
            >
              <div className="mt-2 p-4 rounded-2xl bg-background/80 backdrop-blur-sm border border-border shadow-xl">
                <div className="flex items-center justify-center space-x-6">
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                      Было
                    </p>
                    <p className="text-lg font-bold opacity-80">
                      {selectedAccount.currentBalance.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>

                  <div className="flex items-center text-muted-foreground/50">
                    <ArrowRight className="size-5 hidden md:block" />
                    <ArrowDown className="size-5 md:hidden" />
                  </div>

                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                      Стало
                    </p>
                    <motion.p
                      key={finalAmount} // Анимация цифр при изменении суммы
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        'text-xl font-black',
                        isExpense ? 'text-destructive' : 'text-success'
                      )}
                    >
                      {(
                        selectedAccount.currentBalance +
                        (isExpense ? -finalAmount : finalAmount)
                      ).toLocaleString('ru-RU')}{' '}
                      ₽
                    </motion.p>
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
