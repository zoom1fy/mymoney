import { FieldConfig } from '@/components/ui/modals/UniversalModal'

import { IAccount } from '@/types/account.types'

export const getTransactionFields = (accounts: IAccount[]): FieldConfig[] => [
  {
    name: 'amount',
    label: 'Сумма',
    type: 'number',
    required: true,
    defaultValue: ''
  },
  {
    name: 'accountId',
    label: 'Счет',
    type: 'select',
    options: accounts.map(account => ({
      value: account.id,
      label: account.name
    })),
    required: true
  },
  {
    name: 'description',
    label: 'Описание',
    type: 'text'
  }
]
