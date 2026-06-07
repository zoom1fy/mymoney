import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyCode } from '../common/enums/currency.enum';
import { TransactionType } from '../transaction/enums/transaction-type.enum';

@Injectable()
export class SeedService {
  constructor(private prisma: PrismaService) {}

  async seedNewUser(userId: string) {
    const currencyCode = CurrencyCode.RUB;

    // 1. Income categories
    const salaryCategory = await this.prisma.category.create({
      data: {
        userId,
        name: 'Зарплата',
        icon: 'Briefcase',
        currencyCode,
        color: '#22c55e',
        isExpense: false,
      },
    });

    await this.prisma.category.create({
      data: {
        userId,
        name: 'Фриланс',
        icon: 'Laptop',
        currencyCode,
        color: '#3b82f6',
        isExpense: false,
      },
    });

    // 2. Expense categories
    const foodCategory = await this.prisma.category.create({
      data: {
        userId,
        name: 'Продукты',
        icon: 'ShoppingCart',
        currencyCode,
        color: '#ef4444',
        isExpense: true,
      },
    });

    const transportCategory = await this.prisma.category.create({
      data: {
        userId,
        name: 'Транспорт',
        icon: 'Car',
        currencyCode,
        color: '#f59e0b',
        isExpense: true,
      },
    });

    // 3. Accounts
    const cashAccount = await this.prisma.account.create({
      data: {
        userId,
        name: 'Наличные',
        icon: 'Wallet',
        categoryId: 1,
        typeId: 1,
        currencyCode,
        currentBalance: 50000,
      },
    });

    await this.prisma.account.create({
      data: {
        userId,
        name: 'Копилка',
        icon: 'PiggyBank',
        categoryId: 2,
        typeId: 4,
        currencyCode,
        currentBalance: 20000,
      },
    });

    // 4. Transactions
    const now = new Date();

    await this.prisma.transaction.create({
      data: {
        userId,
        accountId: cashAccount.id,
        categoryId: salaryCategory.id,
        amount: 100000,
        currencyCode,
        type: TransactionType.INCOME,
        description: 'Зарплата за месяц',
        transactionDate: new Date(now.getFullYear(), now.getMonth(), 5),
      },
    });

    await this.prisma.transaction.create({
      data: {
        userId,
        accountId: cashAccount.id,
        categoryId: foodCategory.id,
        amount: 15000,
        currencyCode,
        type: TransactionType.EXPENSE,
        description: 'Продукты на неделю',
        transactionDate: new Date(now.getFullYear(), now.getMonth(), 10),
      },
    });

    await this.prisma.transaction.create({
      data: {
        userId,
        accountId: cashAccount.id,
        categoryId: transportCategory.id,
        amount: 5000,
        currencyCode,
        type: TransactionType.EXPENSE,
        description: 'Проезд и топливо',
        transactionDate: new Date(now.getFullYear(), now.getMonth(), 15),
      },
    });
  }
}
