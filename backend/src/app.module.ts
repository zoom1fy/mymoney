import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './prisma/prisma.service';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AccountModule } from './account/account.module';
import { CategoryModule } from './category/category.module';
import { CurrencyModule } from './currency/currency.module';
import { TransactionModule } from './transaction/transaction.module';
import { SeedModule } from './seed/seed.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env.local'],
    }),
    ThrottlerModule.forRoot([{ ttl: 10000, limit: 30 }]), // 30 requests per 10s globally; overridden per-route in auth
    AuthModule,
    UserModule,
    AccountModule,
    CategoryModule,
    CurrencyModule,
    TransactionModule,
    SeedModule,
    MailModule,
  ],
  providers: [PrismaService, { provide: APP_GUARD, useClass: ThrottlerBehindProxyGuard }],
})
export class AppModule {}
