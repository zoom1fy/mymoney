import { CurrencyCode } from '@/types/account.types'

export const currencySymbols: Record<CurrencyCode, string> = {
  [CurrencyCode.RUB]: '₽',
  [CurrencyCode.USD]: '$',
  [CurrencyCode.EUR]: '€',
  [CurrencyCode.BTC]: '₿'
}

export const getCurrencySymbol = (code: CurrencyCode): string => {
  return currencySymbols[code] || code
}
