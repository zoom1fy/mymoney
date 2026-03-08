import { CurrencyCode } from './account.types'
import { IBase } from './root.types'

/**
 * Типы транзакций.
 * Используются для указания типа операции в системе.
 */
export enum TransactionType {
  INCOME = 'INCOME',   // Доход
  EXPENSE = 'EXPENSE', // Расход
  TRANSFER = 'TRANSFER' // Перевод между счетами
}

/**
 * Интерфейс создания транзакции.
 * Используется на фронте при отправке данных на бэкенд.
 */
export interface ICreateTransaction {
  accountId: number               // ID счета, с которого списываются/начисляются деньги
  targetAccountId?: number        // ID целевого счета (для переводов)
  categoryId?: number             // ID категории (доход/расход)
  amount: number                  // Сумма транзакции
  description?: string            // Комментарий или описание
  type: TransactionType           // Тип транзакции
  currencyCode: CurrencyCode      // Валюта транзакции
  transactionDate?: string        // Дата транзакции (если не передана, ставится текущая)
}

/**
 * Полная транзакция.
 * Используется при получении данных с бэка на фронт.
 * transactionDate здесь обязательный, т.к. все транзакции из бэка всегда имеют дату.
 */
export interface ITransaction extends ICreateTransaction, IBase {
  transactionDate: string
}

/**
 * Ответ от API при запросе списка транзакций.
 * Используется для пагинации: nextCursor нужен для запроса следующей страницы.
 */
export interface ITransactionResponse {
  data: ITransaction[]           // Массив транзакций
  nextCursor: number | null      // Курсор для следующей страницы (null, если больше нет данных)
}

/**
 * Интерфейс обновления транзакции.
 * Частичное обновление: можно передавать только изменяемые поля.
 * Используется на фронте при редактировании транзакции.
 */
export type IUpdateTransaction = Partial<ICreateTransaction>