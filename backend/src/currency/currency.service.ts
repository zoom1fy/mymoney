import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { CurrencyCode, CurrencyType, currencyTypeMap } from '../common/enums/currency.enum';
import { PrismaService } from '../prisma/prisma.service';

// Response shapes from each upstream API.

interface CbrValute {
  Value: number;
  Nominal: number;
}
interface CbrResponse {
  Valute: Record<string, CbrValute>;
}

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface ExchangeRateHostResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface CoinGeckoResponse {
  [coinId: string]: {
    [currency: string]: number;
  };
}

interface BinanceTickerResponse {
  symbol: string;
  price: string;
}

interface FawazResponse {
  date: string;
  [base: string]: string | Record<string, number>;
}

type RateFetcher = (from: string, to: string) => Promise<number | null>;

@Injectable()
export class CurrencyService {
  private readonly sources: { name: string; fetch: RateFetcher }[];

  private isCrypto(from: string, to: string): boolean {
    return currencyTypeMap[from as CurrencyCode] === CurrencyType.CRYPTO
        || currencyTypeMap[to as CurrencyCode] === CurrencyType.CRYPTO;
  }

  private readonly coinGeckoIds: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    USDC: 'usd-coin',
    BNB: 'binancecoin',
    XRP: 'xrp',
    SOL: 'solana',
    TRX: 'tron',
    DOGE: 'dogecoin',
    GRAM: 'the-open-network',
  };

  // Binance spot pairs for crypto → fiat
  private readonly binancePairs: Record<string, Record<string, string>> = {
    BTC: { USD: 'BTCUSDT', EUR: 'BTCEUR', RUB: 'BTCRUB' },
    ETH: { USD: 'ETHUSDT', EUR: 'ETHEUR', RUB: 'ETHRUB' },
    BNB: { USD: 'BNBUSDT', EUR: 'BNBEUR', RUB: 'BNBRUB' },
    XRP: { USD: 'XRPUSDT', EUR: 'XRPEUR', RUB: 'XRPRUB' },
    SOL: { USD: 'SOLUSDT', EUR: 'SOLEUR', RUB: 'SOLRUB' },
    TRX: { USD: 'TRXUSDT', EUR: 'TRXEUR', RUB: 'TRXRUB' },
    DOGE: { USD: 'DOGEUSDT', EUR: 'DOGEEUR', RUB: 'DOGERUB' },
  };

  constructor(
    private httpService: HttpService,
    private prisma: PrismaService,
  ) {
    this.sources = [
      { name: 'cbr', fetch: (from, to) => this.fetchFromCbr(from, to) },
      { name: 'frankfurter', fetch: (from, to) => this.fetchFromFrankfurter(from, to) },
      { name: 'exchangerate-host', fetch: (from, to) => this.fetchFromExchangeRateHost(from, to) },
      { name: 'coingecko', fetch: (from, to) => this.fetchFromCoinGecko(from, to) },
      { name: 'binance', fetch: (from, to) => this.fetchFromBinance(from, to) },
      { name: 'fawaz-ahmed', fetch: (from, to) => this.fetchFromFawazAhmed(from, to) },
    ];
  }

  /** Return all currencies from the database. */
  async findAll() {
    return this.prisma.currency.findMany({ orderBy: { code: 'asc' } });
  }

  async getExchangeRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;

    const errors: string[] = [];

    for (const source of this.sources) {
      try {
        const rate = await source.fetch(from, to);
        if (rate !== null) return rate;
      } catch (err) {
        errors.push(`${source.name}: ${(err as Error).message}`);
      }
    }

    throw new BadRequestException(
      `Не удалось получить курс ${from}→${to}. Все источники недоступны: ${errors.join('; ')}`
    );
  }

  // Primary source: Central Bank of Russia (RUB fiat rates).

  private async fetchFromCbr(from: string, to: string): Promise<number | null> {
    const url = 'https://www.cbr-xml-daily.ru/daily_json.js';
    const { data } = await lastValueFrom(this.httpService.get<CbrResponse>(url));
    const rates = data.Valute;

    if (from === 'RUB') {
      const entry = rates[to];
      if (!entry) return null;
      return (entry.Nominal ?? 1) / entry.Value;
    }

    if (to === 'RUB') {
      const entry = rates[from];
      if (!entry) return null;
      return entry.Value / (entry.Nominal ?? 1);
    }

    const rateToRUB = await this.fetchFromCbr(from, 'RUB');
    const rateFromRUB = await this.fetchFromCbr('RUB', to);
    if (rateToRUB === null || rateFromRUB === null) return null;
    return rateToRUB * rateFromRUB;
  }

  // Fallback 1: Frankfurter API (ECB data, fiat only).

  private async fetchFromFrankfurter(from: string, to: string): Promise<number | null> {
    if (this.isCrypto(from, to)) return null;

    const url = `https://api.frankfurter.app/latest?from=${from}&to=${to}`;
    const { data } = await lastValueFrom(this.httpService.get<FrankfurterResponse>(url));
    const rate = data.rates?.[to];
    if (rate === undefined) return null;
    return rate;
  }

  // Fallback 2: ExchangeRate.host (fiat only).

  private async fetchFromExchangeRateHost(from: string, to: string): Promise<number | null> {
    if (this.isCrypto(from, to)) return null;

    const url = `https://api.exchangerate.host/latest?base=${from}&symbols=${to}`;
    const { data } = await lastValueFrom(this.httpService.get<ExchangeRateHostResponse>(url));
    const rate = data.rates?.[to];
    if (rate === undefined) return null;
    return rate;
  }

  // Fallback 3: CoinGecko (crypto + fiat, no API key required).

  private async fetchFromCoinGecko(from: string, to: string): Promise<number | null> {
    const coinId = this.coinGeckoIds[from] || this.coinGeckoIds[to];
    if (!coinId) return null;

    const targetCurrency = (this.coinGeckoIds[from] ? to : from).toLowerCase();
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${targetCurrency}`;
    const { data } = await lastValueFrom(this.httpService.get<CoinGeckoResponse>(url));
    const rate = data[coinId]?.[targetCurrency];
    if (rate === undefined) return null;

    return this.coinGeckoIds[to] ? 1 / rate : rate;
  }

  // Fallback 4: Binance (crypto, no API key required).

  private async fetchFromBinance(from: string, to: string): Promise<number | null> {
    const symbol = this.binancePairs[from]?.[to];
    if (symbol) {
      const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
      const { data } = await lastValueFrom(this.httpService.get<BinanceTickerResponse>(url));
      return parseFloat(data.price);
    }

    const inverseSymbol = this.binancePairs[to]?.[from];
    if (inverseSymbol) {
      const url = `https://api.binance.com/api/v3/ticker/price?symbol=${inverseSymbol}`;
      const { data } = await lastValueFrom(this.httpService.get<BinanceTickerResponse>(url));
      return 1 / parseFloat(data.price);
    }

    return null;
  }

  // Fallback 5: Fawaz Ahmed community CDN (unlimited, no API key).

  private async fetchFromFawazAhmed(from: string, to: string): Promise<number | null> {
    const baseLower = from.toLowerCase();
    const targetLower = to.toLowerCase();

    const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${baseLower}.json`;
    const { data } = await lastValueFrom(this.httpService.get<FawazResponse>(url));
    const currencies = data[baseLower] as Record<string, number> | undefined;
    if (!currencies) return null;

    const rate = currencies[targetLower];
    if (rate === undefined) return null;
    return rate;
  }
}
