import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

interface ValuteEntry {
  Value: number;
  Nominal: number;
}

interface CbrResponse {
  Valute: Record<string, ValuteEntry>;
}

@Injectable()
export class CurrencyService {
  constructor(private httpService: HttpService) {}

  async getExchangeRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;

    const url = 'https://www.cbr-xml-daily.ru/daily_json.js';
    const { data } = await lastValueFrom(this.httpService.get<CbrResponse>(url));
    const rates = data.Valute;

    if (from === 'RUB') {
      const target = rates[to];
      if (!target) throw new BadRequestException(`Курс для ${to} не найден`);
      return target.Value / (target.Nominal ?? 1);
    }

    if (to === 'RUB') {
      const source = rates[from];
      if (!source) throw new BadRequestException(`Курс для ${from} не найден`);
      return 1 / (source.Value / (source.Nominal ?? 1));
    }

    const rateToRUB = await this.getExchangeRate(from, 'RUB');
    const rateFromRUB = await this.getExchangeRate('RUB', to);
    return rateToRUB * rateFromRUB;
  }
}
