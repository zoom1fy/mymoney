import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AccountModule } from './account/account.module';
import { CategoryModule } from './category/category.module';
import { CurrencyModule } from './currency/currency.module';
import { TransactionModule } from './transaction/transaction.module';
import { ChatModule } from './chat/chat.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // чтобы process.env был доступен в любом модуле
    }),
    AuthModule,
    UserModule,
    AccountModule,
    CategoryModule,
    CurrencyModule,
    TransactionModule,
    ChatModule,
    SeedModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
