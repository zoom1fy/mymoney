import { IAccount } from '@/types/account.type'
import { ICategory } from '@/types/category.type'
import { IUser } from '@/types/auth.type'

import { axiosWithAuth } from '../api/interceptor'

export interface IDashboardResponse {
  profile: IUser
  accounts: IAccount[]
  categories: ICategory[]
  archivedCategories: ICategory[]
  expenseSummary: { categoryId: number | null; categoryName: string | null; categoryColor: string | null; totalAmount: number }[]
  incomeSummary: { categoryId: number | null; categoryName: string | null; categoryColor: string | null; totalAmount: number }[]
}

export const dashboardService = {
  async getDashboard(from: string, to: string) {
    const response = await axiosWithAuth.get<IDashboardResponse>('/dashboard', {
      params: { from, to }
    })
    return response.data
  }
}
