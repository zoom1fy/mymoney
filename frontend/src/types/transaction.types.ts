import { CurrencyCode } from './account.types'
import { IBase } from './root.types'

/**
 * Типы транзакций
 */
export enum TransactionType {
  INCOME = 1, // Доход
  EXPENSE = 2, // Расход
  TRANSFER = 3 // Перевод
}

/**
 * Интерфейс создания транзакции (фронт → бэк)
 */
export interface ICreateTransaction {
  accountId: number
  targetAccountId?: number
  categoryId?: number
  amount: number
  description?: string
  type: TransactionType
  currencyCode: CurrencyCode
}

/**
 * Полная транзакция (бэк → фронт)
 */
export interface ITransaction extends ICreateTransaction, IBase {}

/**
 * Интерфейс обновления транзакции (частичное обновление)
 */
export type IUpdateTransaction = Partial<ICreateTransaction>
