import { Controller, Get, Query } from '@nestjs/common';
import { CurrencyService } from './currency.service';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get()
  async findAll() {
    return this.currencyService.findAll();
  }

  @Get('rate')
  async getRate(@Query('from') from: string, @Query('to') to: string) {
    if (!from || !to) {
      return { error: 'Параметры from и to обязательны' };
    }
    const rate = await this.currencyService.getExchangeRate(from.toUpperCase(), to.toUpperCase());
    return { from: from.toUpperCase(), to: to.toUpperCase(), rate };
  }
}
