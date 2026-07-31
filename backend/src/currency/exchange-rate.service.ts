import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { CurrencyCode } from '../common/enums/currency.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyService } from './currency.service';

@Injectable()
export class ExchangeRateService implements OnApplicationBootstrap {
  private readonly syncIntervalMs = 3 * 60 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private currencyService: CurrencyService
  ) {}

  async onApplicationBootstrap() {
    await this.syncRates();
    setInterval(() => void this.syncRates(), this.syncIntervalMs);
  }

  async syncRates() {
    const currencies = Object.values(CurrencyCode).filter((c) => !c.includes('RUB'));
    for (const from of currencies) {
      try {
        const rate = await this.currencyService.getExchangeRate(from, 'RUB');
        await this.prisma.exchangeRate.upsert({
          where: { from_to: { from, to: 'RUB' } },
          update: { rate },
          create: { from, to: 'RUB', rate },
        });
      } catch {
        // skip if rate unavailable
      }
    }
  }

  /** Convert an amount from any currency to RUB using the latest stored rate. */
  async convertToRub(amount: number, from: string): Promise<number> {
    if (from === 'RUB') return amount;
    let rate: number | null = null;
    const row = await this.prisma.exchangeRate.findUnique({
      where: { from_to: { from, to: 'RUB' } },
    });
    if (row) {
      rate = Number(row.rate);
    } else {
      rate = await this.fetchAndStoreRate(from);
    }
    if (rate === null) return amount;
    return amount * rate;
  }

  /** Bulk-fetch rates — try DB first, live-fetch any missing currencies. */
  async getRatesToRub(currencies: string[]): Promise<Map<string, number>> {
    const cached = await this.prisma.exchangeRate.findMany({
      where: { to: 'RUB', from: { in: currencies } },
    });
    const map = new Map<string, number>(cached.map((r) => [r.from, Number(r.rate)]));
    map.set('RUB', 1);

    const missing = currencies.filter((c) => c !== 'RUB' && !map.has(c));
    for (const from of missing) {
      const rate = await this.fetchAndStoreRate(from);
      if (rate !== null) map.set(from, rate);
    }

    return map;
  }

  /** Try to fetch a live rate and persist it, return null on failure. */
  private async fetchAndStoreRate(from: string): Promise<number | null> {
    try {
      const rate = await this.currencyService.getExchangeRate(from, 'RUB');
      await this.prisma.exchangeRate.upsert({
        where: { from_to: { from, to: 'RUB' } },
        update: { rate },
        create: { from, to: 'RUB', rate },
      });
      return rate;
    } catch {
      return null;
    }
  }
}
