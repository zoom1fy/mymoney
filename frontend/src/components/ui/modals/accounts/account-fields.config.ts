import { FieldConfig } from '@/components/ui/modals/UniversalModal'

import {
  AccountCategoryEnum,
  AccountTypeEnum,
  CurrencyCode,
  IAccount
} from '@/types/account.types'

export const getAccountFields = (account?: IAccount): FieldConfig[] => [
  {
    name: 'name',
    label: 'Название счета',
    type: 'text',
    placeholder: 'Введите название',
    required: true,
    defaultValue: account?.name || '',
    validation: (value: string) =>
      value.length < 2 ? 'Название должно быть не менее 2 символов' : null
  },
  {
    name: 'categoryId',
    label: 'Категория',
    type: 'select',
    required: true,
    defaultValue: account?.categoryId || AccountCategoryEnum.ACCOUNTS,
    options: [
      { value: AccountCategoryEnum.ACCOUNTS, label: 'Счета' },
      { value: AccountCategoryEnum.SAVINGS, label: 'Сбережения' }
    ]
  },
  {
    name: 'typeId',
    label: 'Тип счета',
    type: 'select',
    required: true,
    defaultValue: account?.typeId || AccountTypeEnum.CARD,
    options: [
      { value: AccountTypeEnum.CARD, label: 'Карта' },
      { value: AccountTypeEnum.CASH, label: 'Наличные' },
      { value: AccountTypeEnum.CRYPTO, label: 'Криптовалюта' },
      { value: AccountTypeEnum.SAVING, label: 'Сберегательный' },
      { value: AccountTypeEnum.DEPOSIT, label: 'Депозит' }
    ]
  },
  {
    name: 'currencyCode',
    label: 'Валюта',
    type: 'select',
    required: true,
    defaultValue: account?.currencyCode || CurrencyCode.RUB,
    options: [
      { value: CurrencyCode.RUB, label: 'RUB - Российский рубль' },
      { value: CurrencyCode.USD, label: 'USD - Доллар США' },
      { value: CurrencyCode.EUR, label: 'EUR - Евро' },
      { value: CurrencyCode.BTC, label: 'BTC - Биткоин' }
    ]
  },
  {
    name: 'currentBalance',
    label: 'Баланс',
    type: 'number',
    placeholder: '0.00',
    defaultValue: account?.currentBalance || 0,
    validation: (value: number) =>
      value < 0 ? 'Баланс не может быть отрицательным' : null
  }
]
