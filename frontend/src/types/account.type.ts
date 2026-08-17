import {
  BadgeCent,
  BadgeDollarSign,
  BadgeEuro,
  BadgeIndianRupee,
  BadgeJapaneseYen,
  BadgePoundSterling,
  BadgeRussianRuble,
  BadgeSwissFranc,
  Banknote,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Bitcoin,
  Building2,
  ChartCandlestick,
  ChartColumnBig,
  ChartPie,
  CircleDollarSign,
  CirclePoundSterling,
  Coins,
  CreditCard,
  Diamond,
  DollarSign,
  Euro,
  Factory,
  Gem,
  HandCoins,
  Home,
  JapaneseYen,
  KeyRound,
  Landmark,
  LockKeyhole,
  LucideIcon,
  Nfc,
  Percent,
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
  ShieldCheck,
  Store,
  TrendingUp,
  Vault,
  Wallet,
  WalletCards,
  WalletMinimal,
  Warehouse
} from 'lucide-react'

import { IBase } from './root.type'

export enum CurrencyType {
  FIAT = 'FIAT',
  CRYPTO = 'CRYPTO',
}

export enum AccountCategoryEnum {
  ACCOUNTS = 1,
  SAVINGS = 2,
  INVESTMENTS = 3,
  LOANS = 4
}

// Options for category/type pickers — single source of truth for the UI
export const accountCategories: AccountCategoryEnum[] = [
  AccountCategoryEnum.ACCOUNTS,
  AccountCategoryEnum.SAVINGS,
  AccountCategoryEnum.INVESTMENTS,
  AccountCategoryEnum.LOANS
]

export const accountCategoryNameMap: Record<AccountCategoryEnum, string> = {
  [AccountCategoryEnum.ACCOUNTS]: 'Основные счета',
  [AccountCategoryEnum.SAVINGS]: 'Накопления',
  [AccountCategoryEnum.INVESTMENTS]: 'Инвестиции',
  [AccountCategoryEnum.LOANS]: 'Кредиты и долги'
}

export enum AccountTypeEnum {
  CASH = 1,
  BANK = 2,
  DEPOSIT = 3,
  BROKER = 4,
  CREDIT_CARD = 5,
  CRYPTO = 6
}

export const accountTypes: AccountTypeEnum[] = [
  AccountTypeEnum.CASH,
  AccountTypeEnum.BANK,
  AccountTypeEnum.DEPOSIT,
  AccountTypeEnum.BROKER,
  AccountTypeEnum.CREDIT_CARD,
  AccountTypeEnum.CRYPTO
]

export const accountTypeNameMap: Record<AccountTypeEnum, string> = {
  [AccountTypeEnum.CASH]: 'Наличные',
  [AccountTypeEnum.BANK]: 'Банковский счет',
  [AccountTypeEnum.DEPOSIT]: 'Депозит/Вклад',
  [AccountTypeEnum.BROKER]: 'Брокерский счет',
  [AccountTypeEnum.CREDIT_CARD]: 'Кредитная карта',
  [AccountTypeEnum.CRYPTO]: 'Криптокошелек'
}

// Icon lookup for the account picker UI — name → Lucide component
export const accountIcons: Record<string, LucideIcon> = {
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
  Nfc,
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
  Vault,
  LockKeyhole,
  KeyRound,
  PoundSterling,
  RussianRuble,
  BadgeRussianRuble,
  BadgeCent,
  BadgeDollarSign,
  BadgeEuro,
  BadgeIndianRupee,
  BadgeJapaneseYen,
  BadgePoundSterling,
  BadgeSwissFranc,
  ChartCandlestick,
  ChartColumnBig,
  ChartPie,
  TrendingUp,
  Percent,
  ShieldCheck,
  Gem,
  Diamond,
  Building2,
  Store,
  Factory,
  Warehouse,
  Home
}

export type AccountIconName = keyof typeof accountIcons

// Payload sent to POST /api/accounts
export interface ICreateAccount {
  name: string
  categoryId: AccountCategoryEnum
  typeId: AccountTypeEnum
  currencyCode: string
  icon?: AccountIconName
  currentBalance: number
}

// Full account returned from the API
export interface IAccount extends IBase, ICreateAccount {
  isDeleted: boolean
  currencySymbol: string
}

// Partial update — only changed fields are sent to PATCH /api/accounts/:id
export type IUpdateAccount = Partial<ICreateAccount>
