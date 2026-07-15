import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AccountModule } from '../account/account.module';
import { CategoryModule } from '../category/category.module';
import { TransactionModule } from '../transaction/transaction.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [UserModule, AccountModule, CategoryModule, TransactionModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
