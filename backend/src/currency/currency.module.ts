import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyService } from './currency.service';
import { ExchangeRateService } from './exchange-rate.service';
import { CurrencyController } from './currency.controller';

@Module({
  imports: [HttpModule],
  controllers: [CurrencyController],
  providers: [CurrencyService, ExchangeRateService, PrismaService],
  exports: [CurrencyService, ExchangeRateService],
})
export class CurrencyModule {}
