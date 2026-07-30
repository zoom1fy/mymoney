import { CurrencyType } from './currency-type.enum';
export { CurrencyType };

export enum CurrencyCode {
  RUB = 'RUB',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CNY = 'CNY',
  BTC = 'BTC',
  ETH = 'ETH',
  USDT = 'USDT',
  USDC = 'USDC',
  BNB = 'BNB',
  XRP = 'XRP',
  SOL = 'SOL',
  TRX = 'TRX',
  DOGE = 'DOGE',
  GRAM = 'GRAM',
}

export const currencyTypeMap: Record<CurrencyCode, CurrencyType> = {
  [CurrencyCode.RUB]: CurrencyType.FIAT,
  [CurrencyCode.USD]: CurrencyType.FIAT,
  [CurrencyCode.EUR]: CurrencyType.FIAT,
  [CurrencyCode.GBP]: CurrencyType.FIAT,
  [CurrencyCode.JPY]: CurrencyType.FIAT,
  [CurrencyCode.CNY]: CurrencyType.FIAT,
  [CurrencyCode.BTC]: CurrencyType.CRYPTO,
  [CurrencyCode.ETH]: CurrencyType.CRYPTO,
  [CurrencyCode.USDT]: CurrencyType.CRYPTO,
  [CurrencyCode.USDC]: CurrencyType.CRYPTO,
  [CurrencyCode.BNB]: CurrencyType.CRYPTO,
  [CurrencyCode.XRP]: CurrencyType.CRYPTO,
  [CurrencyCode.SOL]: CurrencyType.CRYPTO,
  [CurrencyCode.TRX]: CurrencyType.CRYPTO,
  [CurrencyCode.DOGE]: CurrencyType.CRYPTO,
  [CurrencyCode.GRAM]: CurrencyType.CRYPTO,
};
