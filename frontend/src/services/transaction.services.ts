import { axiosWithAuth } from '../api/interceptor'
import {
  ICreateTransaction,
  ITransaction,
  IUpdateTransaction
} from '../types/transaction.types'

export const transactionService = {
  async create(data: ICreateTransaction) {
    const response = await axiosWithAuth.post<ITransaction>(
      '/transactions',
      data
    )
    return response.data
  },

  async getAll() {
    const response = await axiosWithAuth.get<ITransaction[]>('/transactions')
    return response.data
  },

  async getById(id: number) {
    const response = await axiosWithAuth.get<ITransaction>(
      `/transactions/${id}`
    )
    return response.data
  },

  async update(id: number, data: IUpdateTransaction) {
    const response = await axiosWithAuth.patch<ITransaction>(
      `/transactions/${id}`,
      data
    )
    return response.data
  },

  async delete(id: number) {
    // на бэке DELETE /transactions/:id возвращает 204, тело пустое
    const response = await axiosWithAuth.delete<void>(`/transactions/${id}`)
    return response.data
  }
}
