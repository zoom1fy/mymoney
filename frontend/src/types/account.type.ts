import {
  BadgeRussianRuble,
  Banknote,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Bitcoin,
  CircleDollarSign,
  CirclePoundSterling,
  Coins,
  CreditCard,
  DollarSign,
  Euro,
  HandCoins,
  JapaneseYen,
  Landmark,
  LucideIcon,
  PiggyBank,
  PoundSterling,
  Receipt,
  ReceiptCent,
  ReceiptEuro,
  ReceiptJapaneseYen,
  ReceiptPoundSterling,
  ReceiptRussianRuble,
  ReceiptSwissFranc,
  ReceiptTurkishLira,
  RussianRuble,
  Wallet,
  WalletCards,
  WalletMinimal
} from 'lucide-react'

import { IBase } from './root.type'

export enum CurrencyCode {
  RUB = 'RUB',
  USD = 'USD',
  EUR = 'EUR',
  BTC = 'BTC'
}

export enum AccountCategoryEnum {
  ACCOUNTS = 1,
  SAVINGS = 2
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

// Icon lookup for the account picker UI — name → Lucide component
export const AccountIcons: Record<string, LucideIcon> = {
  BanknoteArrowDown,
  BanknoteArrowUp,
  Receipt,
  ReceiptCent,
  ReceiptEuro,
  ReceiptJapaneseYen,
  ReceiptPoundSterling,
  ReceiptRussianRuble,
  ReceiptSwissFranc,
  ReceiptTurkishLira,
  CreditCard,
  WalletCards,
  Wallet,
  WalletMinimal,
  Coins,
  HandCoins,
  CircleDollarSign,
  CirclePoundSterling,
  Banknote,
  Bitcoin,
  DollarSign,
  Euro,
  JapaneseYen,
  Landmark,
  PiggyBank,
  PoundSterling,
  RussianRuble,
  BadgeRussianRuble
}

export type AccountIconName = keyof typeof AccountIcons

// Payload sent to POST /api/accounts
export interface ICreateAccount {
  name: string
  categoryId: AccountCategoryEnum
  typeId: AccountTypeEnum
  currencyCode: CurrencyCode
  icon?: AccountIconName
  currentBalance: number
}

// Full account returned from the API
export interface IAccount extends IBase, ICreateAccount {
  isDeleted: boolean
}

// Partial update — only changed fields are sent to PATCH /api/accounts/:id
export type IUpdateAccount = Partial<ICreateAccount>
