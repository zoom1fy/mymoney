import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { CurrencyModule } from '../currency/currency.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [CurrencyModule],
  controllers: [AccountController],
  providers: [AccountService, PrismaService],
  exports: [AccountService],
})
export class AccountModule {}
