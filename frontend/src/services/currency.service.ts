import { isTauri } from '../lib/platform'
import { axiosWithAuth } from '../api/interceptor'
import { currencyLocalService } from './local/currency.service'

export interface ICurrency {
  code: string
  name: string
  symbol: string
  type: 'FIAT' | 'CRYPTO'
}

const currencyServiceHttp = {
  async getAll() {
    const response = await axiosWithAuth.get<ICurrency[]>('/currency')
    return response.data
  }
}

export const currencyService = isTauri() ? currencyLocalService : currencyServiceHttp
