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
  SAVINGS = 2
}

export const accountCategoryNameMap: Record<AccountCategoryEnum, string> = {
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
