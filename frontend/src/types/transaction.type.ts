import { CurrencyCode } from './account.type'
import { IBase } from './root.type'

// Transaction type discriminator — controls balance increment/decrement and transfer logic
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER'
}

// Payload sent to POST /api/transactions
export interface ICreateTransaction {
  accountId: number
  targetAccountId?: number
  categoryId?: number
  amount: number
  description?: string
  type: TransactionType
  currencyCode: CurrencyCode
  transactionDate?: string // Defaults to now on the server when omitted
}

// Full transaction returned from the API — transactionDate is always present
export interface ITransaction extends ICreateTransaction, IBase {
  transactionDate: string
}

// Paginated API response with cursor for the next page (null = last page)
export interface ITransactionResponse {
  data: ITransaction[]
  nextCursor: number | null
}

// Partial update — only changed fields are sent to PATCH /api/transactions/:id
export type IUpdateTransaction = Partial<ICreateTransaction>
