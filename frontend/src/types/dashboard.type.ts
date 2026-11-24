import type { AccountCategoryEnum } from './account.type'

// Total balance of all accounts in one category, converted to the base currency
export interface ICategoryTotal {
  categoryId: AccountCategoryEnum
  totalAmount: number
}
