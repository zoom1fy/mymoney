import { IBase } from './root.types'

export enum CurrencyCode {
  RUB = 'RUB',
  USD = 'USD',
  EUR = 'EUR',
  BTC = 'BTC'
}

export enum AccountCategoryEnum {
  ACCOUNTS = 1, // "Счета"
  SAVINGS = 2 // "Сбережения"
}

export const AccountCategoryNameMap: Record<AccountCategoryEnum, string> = {
  [AccountCategoryEnum.ACCOUNTS]: 'Счет',
  [AccountCategoryEnum.SAVINGS]: 'Сберегательный'
}

export enum AccountTypeEnum {
  CASH = 1,
  CARD = 2,
  CRYPTO = 3,
  SAVING = 4,
  DEPOSIT = 5
}

/**
 * Интерфейс создания аккаунта (фронт → бэк)
 */
export interface ICreateAccount {
  name: string
  categoryId: AccountCategoryEnum
  typeId: AccountTypeEnum
  currencyCode: CurrencyCode
  icon?: string
  currentBalance: number
}

/**
 * Полный аккаунт (бэк → фронт)
 */
export interface IAccount extends IBase, ICreateAccount {}

/**
 * Интерфейс обновления аккаунта (частичный)
 */
export type IUpdateAccount = Partial<ICreateAccount>
