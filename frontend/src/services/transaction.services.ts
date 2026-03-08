import { axiosWithAuth } from '../api/interceptor'
import {
  ICreateTransaction,
  ITransaction,
  ITransactionResponse,
  IUpdateTransaction,
  TransactionType
} from '../types/transaction.types'

export const transactionService = {
  async create(data: ICreateTransaction) {
    const response = await axiosWithAuth.post<ITransaction>(
      '/transactions',
      data
    )
    return response.data
  },

  async getAll(cursor?: number, options?: { from?: Date; to?: Date }) {
    const response = await axiosWithAuth.get<ITransactionResponse>(
      '/transactions',
      {
        params: {
          take: 20,
          cursor,
          from: options?.from?.toISOString(),
          to: options?.to?.toISOString()
        }
      }
    )

    return {
      ...response.data,
      data: response.data.data.map(tx => ({
        ...tx,
        amount: Number(tx.amount),
        type: mapTransactionType(tx.type)
      }))
    }
  },
  async getForPeriod(from: Date, to: Date) {
    const response = await axiosWithAuth.get<ITransactionResponse>(
      '/transactions',
      {
        params: {
          take: 1000,
          from: from.toISOString(),
          to: to.toISOString()
        }
      }
    )

    return response.data.data.map(tx => ({
      ...tx,
      amount: Number(tx.amount),
      type: mapTransactionType(tx.type)
    }))
  },

  async getById(id: number) {
    const response = await axiosWithAuth.get<ITransaction>(
      `/transactions/${id}`
    )
    return {
      ...response.data,
      type: mapTransactionType(response.data.type),
      amount: Number(response.data.amount)
    }
  },

  async update(id: number, data: IUpdateTransaction) {
    const response = await axiosWithAuth.patch<ITransaction>(
      `/transactions/${id}`,
      data
    )
    return {
      ...response.data,
      type: mapTransactionType(response.data.type),
      amount: Number(response.data.amount)
    }
  },

  async delete(id: number) {
    const response = await axiosWithAuth.delete<void>(`/transactions/${id}`)
    return response.data
  }
}

// Вспомогательная функция для преобразования строки в TransactionType
function mapTransactionType(type: string | number): TransactionType {
  switch (type) {
    case 'INCOME':
      return TransactionType.INCOME // 1
    case 'EXPENSE':
      return TransactionType.EXPENSE // 2
    case 'TRANSFER':
      return TransactionType.TRANSFER // 3
    default:
      return type as TransactionType // Если уже число, возвращаем как есть
  }
}
