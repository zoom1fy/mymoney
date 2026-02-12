import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

import { ICategory } from '@/types/category.types'
import { ITransaction, TransactionType } from '@/types/transaction.types'

type Props = {
  transaction: ITransaction
  category?: ICategory
}

export function TransactionItem({ transaction: tx, category }: Props) {
  const isExpense = tx.type === TransactionType.EXPENSE

  return (
    <div className="p-4 hover:bg-accent/50 transition-colors touch-manipulation">
      {/* Мобильный вид */}
      <div className="sm:hidden flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-3">
            <p className="font-medium leading-tight">
              {category?.name || 'Без категории'}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {tx.description || 'Без описания'}
            </p>
          </div>
          <p
            className={`font-bold text-lg whitespace-nowrap ${
              isExpense ? 'text-destructive' : 'text-success'
            }`}
          >
            {isExpense ? '−' : '+'}
            {tx.amount.toLocaleString('ru-RU')} ₽
          </p>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {format(new Date(tx.transactionDate), 'dd.MM.yyyy', { locale: ru })}
          </span>
          <span className="font-medium">{isExpense ? 'Расход' : 'Доход'}</span>
        </div>
      </div>

      {/* Десктопный вид */}
      <div className="hidden sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center">
        <div className="col-span-5">
          <p className="font-medium truncate">
            {tx.description || 'Без описания'}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {category?.name || 'Без категории'}
          </p>
        </div>
        <div className="col-span-3 text-sm">
          {format(new Date(tx.transactionDate), 'dd.MM.yyyy', { locale: ru })}
        </div>
        <div className="col-span-4 text-right">
          <p
            className={`font-semibold ${isExpense ? 'text-destructive' : 'text-success'}`}
          >
            {isExpense ? '−' : '+'} {tx.amount.toLocaleString('ru-RU')} ₽
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isExpense ? 'Расход' : 'Доход'}
          </p>
        </div>
      </div>
    </div>
  )
}
