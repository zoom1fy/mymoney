import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyCode, currencyTypeMap } from '../common/enums/currency.enum';
import { TransactionType } from '../transaction/enums/transaction-type.enum';

const CURRENCY_META: Record<CurrencyCode, { name: string; symbol: string }> = {
  [CurrencyCode.RUB]: { name: 'Российский рубль', symbol: '₽' },
  [CurrencyCode.USD]: { name: 'Доллар США', symbol: '$' },
  [CurrencyCode.EUR]: { name: 'Евро', symbol: '€' },
  [CurrencyCode.GBP]: { name: 'Фунт стерлингов', symbol: '£' },
  [CurrencyCode.JPY]: { name: 'Японская иена', symbol: '¥' },
  [CurrencyCode.CNY]: { name: 'Китайский юань', symbol: '¥' },
  [CurrencyCode.BTC]: { name: 'Bitcoin', symbol: '₿' },
  [CurrencyCode.ETH]: { name: 'Ethereum', symbol: 'Ξ' },
  [CurrencyCode.USDT]: { name: 'Tether', symbol: '₮' },
  [CurrencyCode.USDC]: { name: 'USD Coin', symbol: 'USDC' },
  [CurrencyCode.BNB]: { name: 'BNB', symbol: 'BNB' },
  [CurrencyCode.XRP]: { name: 'XRP', symbol: 'XRP' },
  [CurrencyCode.SOL]: { name: 'Solana', symbol: 'SOL' },
  [CurrencyCode.TRX]: { name: 'TRON', symbol: 'TRX' },
  [CurrencyCode.DOGE]: { name: 'Dogecoin', symbol: 'Ð' },
  [CurrencyCode.GRAM]: { name: 'Gram', symbol: 'GRAM' },
};

const ACCOUNT_CATEGORIES = [
  { id: 1, name: 'Счета' },
  { id: 2, name: 'Накопительные' },
];

const ACCOUNT_TYPES = [
  { id: 1, name: 'Наличные' },
  { id: 2, name: 'Карта' },
  { id: 3, name: 'Депозит' },
  { id: 4, name: 'Инвестиционный счет' },
];

@Injectable()
export class SeedService {
  constructor(private prisma: PrismaService) {}

  // Global reference data (currencies, account categories/types) is shared across
  // all users, so it is upserted idempotently before per-user data is created.
  private async ensureReferenceData() {
    for (const code of Object.values(CurrencyCode) as CurrencyCode[]) {
      const meta = CURRENCY_META[code];
      await this.prisma.db.orm.public.Currency.upsert({
        conflictOn: { code },
        update: { name: meta.name, symbol: meta.symbol, type: currencyTypeMap[code] },
        create: { code, name: meta.name, symbol: meta.symbol, type: currencyTypeMap[code] },
      });
    }

    for (const category of ACCOUNT_CATEGORIES) {
      await this.prisma.db.orm.public.AccountCategory.upsert({
        conflictOn: { id: category.id },
        update: { name: category.name },
        create: category,
      });
    }

    for (const type of ACCOUNT_TYPES) {
      await this.prisma.db.orm.public.AccountType.upsert({
        conflictOn: { id: type.id },
        update: { name: type.name },
        create: type,
      });
    }
  }

  async seedNewUser(userId: string) {
    await this.ensureReferenceData();

    const currencyCode = CurrencyCode.RUB;

    // Income categories first — referenced by initial transactions created below
    const salaryCategory = await this.prisma.db.orm.public.Category.create({
      userId,
      name: 'Зарплата',
      icon: 'Briefcase',
      currencyCode,
      color: '#22c55e',
      isExpense: false,
    });

    await this.prisma.db.orm.public.Category.create({
      userId,
      name: 'Фриланс',
      icon: 'Laptop',
      currencyCode,
      color: '#3b82f6',
      isExpense: false,
    });

    // Expense categories
    const foodCategory = await this.prisma.db.orm.public.Category.create({
      userId,
      name: 'Продукты',
      icon: 'ShoppingCart',
      currencyCode,
      color: '#ef4444',
      isExpense: true,
    });

    const transportCategory = await this.prisma.db.orm.public.Category.create({
      userId,
      name: 'Транспорт',
      icon: 'Car',
      currencyCode,
      color: '#f59e0b',
      isExpense: true,
    });

    // Accounts referencing the categories above
    const cashAccount = await this.prisma.db.orm.public.Account.create({
      userId,
      name: 'Наличные',
      icon: 'Wallet',
      categoryId: 1,
      typeId: 1,
      currencyCode,
      currentBalance: '50000',
    });

    await this.prisma.db.orm.public.Account.create({
      userId,
      name: 'Копилка',
      icon: 'PiggyBank',
      categoryId: 2,
      typeId: 4,
      currencyCode,
      currentBalance: '20000',
    });

    // Sample transactions to give the new user immediate data to explore
    const now = new Date();

    await this.prisma.db.orm.public.Transaction.create({
      userId,
      accountId: cashAccount.id,
      categoryId: salaryCategory.id,
      amount: '100000',
      currencyCode,
      type: TransactionType.INCOME,
      description: 'Зарплата за месяц',
      transactionDate: new Date(now.getFullYear(), now.getMonth(), 5),
    });

    await this.prisma.db.orm.public.Transaction.create({
      userId,
      accountId: cashAccount.id,
      categoryId: foodCategory.id,
      amount: '15000',
      currencyCode,
      type: TransactionType.EXPENSE,
      description: 'Продукты на неделю',
      transactionDate: new Date(now.getFullYear(), now.getMonth(), 10),
    });

    await this.prisma.db.orm.public.Transaction.create({
      userId,
      accountId: cashAccount.id,
      categoryId: transportCategory.id,
      amount: '5000',
      currencyCode,
      type: TransactionType.EXPENSE,
      description: 'Проезд и топливо',
      transactionDate: new Date(now.getFullYear(), now.getMonth(), 15),
    });
  }
}