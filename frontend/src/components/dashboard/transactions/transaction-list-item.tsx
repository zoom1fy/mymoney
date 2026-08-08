import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { HelpCircle } from 'lucide-react'
import { memo } from 'react'

import { useCurrencies } from '@/hooks/use-currencies'
import { applyAlphaToHex } from '@/lib/color-utils'
import { categoryIcons, ICategory } from '@/types/category.type'
import { ITransaction, TransactionType } from '@/types/transaction.type'

type Props = {
  transaction: ITransaction
  category: ICategory
  onEdit: (transaction: ITransaction) => void
}

// Memoized so typing in search doesn't re-render the whole list on each keystroke
export const TransactionItem = memo(function TransactionItem({
  transaction: tx,
  category,
  onEdit
}: Props) {
  const { currencySymbolMap } = useCurrencies()
  const isExpense = tx.type === TransactionType.EXPENSE
  const symbol = currencySymbolMap[tx.currencyCode] || '₽'

  const color = category?.color || 'hsl(var(--primary))'
  const IconComponent =
    (category?.icon && categoryIcons[category.icon]) || HelpCircle

  return (
    <div
      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-transparent cursor-pointer touch-manipulation transition-all duration-200 hover:bg-card hover:border-primary/20 hover:shadow-sm hover:-translate-y-px"
      onClick={() => onEdit(tx)}
    >
      <div
        className="size-11 sm:size-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: applyAlphaToHex(color, 0.50) }}
      >
        <IconComponent className="size-5 sm:size-6 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-[15px] truncate leading-tight">
          {category?.name || 'Без категории'}
        </p>
        <p className="text-[13px] text-muted-foreground truncate mt-0.5">
          {tx.description || (isExpense ? 'Расход' : 'Доход')}
        </p>
      </div>

      <div className="flex flex-col items-end shrink-0">
        <p
          className={`font-bold tabular-nums whitespace-nowrap ${
            isExpense ? 'text-destructive' : 'text-success'
          }`}
        >
          {isExpense ? '−' : '+'}
          {tx.amount.toLocaleString('ru-RU')} {symbol}
        </p>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          {format(new Date(tx.transactionDate), 'dd.MM.yyyy', { locale: ru })}
        </p>
      </div>
    </div>
  )
})
