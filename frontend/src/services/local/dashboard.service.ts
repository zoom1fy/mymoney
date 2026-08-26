import { IAccount } from '../../types/account.type'
import { IUser } from '../../types/auth.type'
import { ICategory } from '../../types/category.type'
import { TransactionType } from '../../types/transaction.type'
import { userLocalService } from './user.service'
import { accountLocalService } from './account.service'
import { categoryLocalService } from './category.service'
import { transactionLocalService, ISummaryItem } from './transaction.service'

// Structurally identical to the web API /dashboard payload
export interface IDashboardResponse {
  profile: IUser
  accounts: IAccount[]
  categories: ICategory[]
  archivedCategories: ICategory[]
  expenseSummary: ISummaryItem[]
  incomeSummary: ISummaryItem[]
}

export const dashboardLocalService = {
  async getDashboard(from: string, to: string): Promise<IDashboardResponse> {
    const [profile, accounts, categories, archivedCategories, expenseSummary, incomeSummary] =
      await Promise.all([
        userLocalService.getProfile(),
        accountLocalService.getAll(),
        categoryLocalService.getAll(),
        categoryLocalService.getArchived(),
        transactionLocalService.getSummaryRaw(from, to, TransactionType.EXPENSE),
        transactionLocalService.getSummaryRaw(from, to, TransactionType.INCOME)
      ])

    return {
      profile,
      accounts,
      categories,
      archivedCategories,
      expenseSummary,
      incomeSummary
    }
  }
}
