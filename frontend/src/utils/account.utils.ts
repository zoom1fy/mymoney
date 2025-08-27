import {
  AccountCategoryEnum,
  AccountTypeEnum,
  CurrencyCode,
  ICreateAccount
} from '@/types/account.types'

export const mapFormDataToCreateAccount = (
  data: Record<string, any>
): ICreateAccount => ({
  name: String(data.name),
  categoryId: Number(data.categoryId) as AccountCategoryEnum,
  typeId: Number(data.typeId) as AccountTypeEnum,
  currencyCode: data.currencyCode as CurrencyCode,
  currentBalance: Number(data.currentBalance)
})
