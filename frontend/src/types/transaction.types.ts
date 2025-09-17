import { CurrencyCode } from './account.types'
import { IBase } from './root.types'

/**
 * Типы транзакций
 */
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER'
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
