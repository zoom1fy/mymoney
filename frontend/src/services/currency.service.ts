import { axiosWithAuth } from '../api/interceptor'

export interface ICurrency {
  code: string
  name: string
  symbol: string
  type: 'FIAT' | 'CRYPTO'
}

export const currencyService = {
  async getAll() {
    const response = await axiosWithAuth.get<ICurrency[]>('/currency')
    return response.data
  },
}
