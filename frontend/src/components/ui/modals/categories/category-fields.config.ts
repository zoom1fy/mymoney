import { FieldConfig } from '@/components/ui/modals/UniversalModal'

import { CurrencyCode } from '@/types/account.types'
import {
  CategoryIconName,
  CategoryIcons,
  ICategory
} from '@/types/category.types'

export const getCategoryFields = (category?: ICategory): FieldConfig[] => [
  {
    name: 'name',
    label: 'Название категории',
    type: 'text',
    placeholder: 'Например: продукты',
    required: true,
    defaultValue: category?.name || '',
    validation: (value: string) =>
      value.length < 2 ? 'Название должно быть не менее 2 символов' : null
  },
  {
    name: 'icon',
    label: 'Иконка',
    type: 'select',
    required: true,
    defaultValue: category?.icon || 'Circle',
    options: Object.keys(CategoryIcons).map(key => ({
      value: key,
      label: key
    }))
  }
]
