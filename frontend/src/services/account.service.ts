import { axiosWithAuth } from '../api/interceptor'
import {
  IAccount,
  ICreateAccount,
  IUpdateAccount
} from '../types/account.types'

export const accountService = {
  async create(data: ICreateAccount) {
    const response = await axiosWithAuth.post<IAccount>('/accounts', data)
    return response.data
  },

  async getAll() {
    const response = await axiosWithAuth.get<IAccount[]>('/accounts')
    return response.data
  },

  async getById(id: number) {
    const response = await axiosWithAuth.get<IAccount>(`/accounts/${id}`)
    return response.data
  },

  async update(id: number, data: IUpdateAccount) {
    const response = await axiosWithAuth.patch<IAccount>(
      `/accounts/${id}`,
      data
    )
    return response.data
  },

  async delete(id: number) {
    const response = await axiosWithAuth.delete<{ message: string }>(
      `/accounts/${id}`
    )
    return response.data
  }
}
