import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AccountSummary,
  AccountWithRelations,
  CategoryAmount,
  CategoryWithRelations,
  FinancialDataResponse,
  FinancialSummary,
  MonthlyBreakdown,
  MonthlyGroup,
  TransactionWithRelations,
} from '../interfaces/financial-data.interface';

@Injectable()
export class FinancialDataService {
  private readonly logger = new Logger(FinancialDataService.name);

  constructor(private prisma: PrismaService) {}

  async getFinancialSummary(
    userId: string,
    start: Date,
    end: Date
  ): Promise<FinancialDataResponse> {
    // ========== ДИАГНОСТИКА ==========
    this.logger.log('========================================');
    this.logger.log('🔍 getFinancialSummary CALLED');
    this.logger.log(`   userId : ${userId}`);
    this.logger.log(
      `   start  : ${start.toISOString()} (${start instanceof Date ? 'Date' : typeof start})`
    );
    this.logger.log(
      `   end    : ${end.toISOString()} (${end instanceof Date ? 'Date' : typeof end})`
    );

    // Raw SQL запрос для проверки (ОБЯЗАТЕЛЬНО)
    const rawTransactions = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, transaction_date, type, amount 
     FROM transactions 
     WHERE user_id = ? 
       AND transaction_date >= ? 
       AND transaction_date <= ? 
     ORDER BY transaction_date DESC`,
      userId,
      start,
      end
    );

    this.logger.log(`   RAW SQL returned ${rawTransactions.length} transactions:`);
    rawTransactions.forEach((t: any) => {
      this.logger.log(
        `      id=${t.id}, date=${t.transaction_date}, type=${t.type}, amount=${t.amount}`
      );
    });

    // Prisma запрос
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        category: true,
        account: {
          include: {
            currency: true,
            category: true,
            type: true,
          },
        },
        currency: true,
      },
      orderBy: { transactionDate: 'desc' },
    });

    this.logger.log(`   PRISMA returned ${transactions.length} transactions:`);
    transactions.forEach((t) => {
      this.logger.log(
        `      id=${t.id}, date=${t.transactionDate.toISOString()}, type=${t.type}, amount=${t.amount}`
      );
    });
    this.logger.log('========================================');

    const [accounts, categories] = await Promise.all([
      this.prisma.account.findMany({
        where: { userId, isDeleted: false },
        include: {
          currency: true,
          category: true,
          type: true,
        },
      }),
      this.prisma.category.findMany({
        where: { userId },
        include: { currency: true },
      }),
    ]);

    const summary = this.analyzeTransactions(transactions, accounts, categories);

    return {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary,
      rawData: {
        transactions,
        accounts,
        categories,
      },
    };
  }

  private analyzeTransactions(
    transactions: TransactionWithRelations[],
    accounts: AccountWithRelations[],
    _categories: CategoryWithRelations[] // Prefix with _ to indicate unused parameter
  ): FinancialSummary {
    const incomes = transactions.filter((t) => t.type === 'INCOME');
    const expenses = transactions.filter((t) => t.type === 'EXPENSE');

    const totalIncome = incomes.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = totalIncome - totalExpenses;

    const expensesByCategory: Record<string, number> = this.groupByCategory(expenses);
    const incomeByCategory: Record<string, number> = this.groupByCategory(incomes);

    const accountSummary: AccountSummary[] = accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type.name,
      category: account.category.name,
      currency: account.currency.symbol,
      balance: Number(account.currentBalance),
    }));

    const monthlyBreakdown: MonthlyBreakdown[] = this.groupByMonth(transactions);
    const topExpenseCategories: CategoryAmount[] = this.getTopCategories(expensesByCategory);
    const topIncomeCategories: CategoryAmount[] = this.getTopCategories(incomeByCategory);

    return {
      totalIncome,
      totalExpenses,
      balance,
      savingsRate: totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0',
      transactionCount: transactions.length,
      incomeCount: incomes.length,
      expenseCount: expenses.length,
      expensesByCategory,
      incomeByCategory,
      accountSummary,
      monthlyBreakdown,
      topExpenseCategories,
      topIncomeCategories,
      averageDailyExpense:
        transactions.length > 0
          ? (totalExpenses / this.getDaysInPeriod(transactions)).toFixed(2)
          : '0',
    };
  }

  private groupByCategory(transactions: TransactionWithRelations[]): Record<string, number> {
    return transactions.reduce(
      (acc, t) => {
        const categoryName: string = t.category?.name || 'Без категории';
        acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
        return acc;
      },
      {} as Record<string, number>
    );
  }

  private groupByMonth(transactions: TransactionWithRelations[]): MonthlyBreakdown[] {
    const grouped: Record<string, MonthlyGroup> = transactions.reduce(
      (acc: Record<string, MonthlyGroup>, t: TransactionWithRelations) => {
        const month: string = t.transactionDate.toISOString().slice(0, 7);

        if (!acc[month]) {
          acc[month] = { income: 0, expenses: 0, count: 0 };
        }

        if (t.type === 'INCOME') {
          acc[month].income += Number(t.amount);
        } else if (t.type === 'EXPENSE') {
          acc[month].expenses += Number(t.amount);
        }

        acc[month].count++;
        return acc;
      },
      {} as Record<string, MonthlyGroup>
    );

    return Object.entries(grouped).map(([month, data]: [string, MonthlyGroup]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      count: data.count,
      balance: data.income - data.expenses,
    }));
  }

  private getDaysInPeriod(transactions: TransactionWithRelations[]): number {
    if (transactions.length === 0) return 1;
    const dates: number[] = transactions.map((t) => t.transactionDate.getTime());
    const minDate: Date = new Date(Math.min(...dates));
    const maxDate: Date = new Date(Math.max(...dates));
    return Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  private getTopCategories(
    categories: Record<string, number>,
    limit: number = 5
  ): CategoryAmount[] {
    return Object.entries(categories)
      .map(([category, amount]: [string, number]) => ({ category, amount }))
      .sort((a: CategoryAmount, b: CategoryAmount) => b.amount - a.amount)
      .slice(0, limit);
  }

  formatForAI(data: { summary: FinancialSummary }): string {
    const s: FinancialSummary = data.summary;

    let text = 'ФИНАНСОВЫЕ ДАННЫЕ:\n\n';

    text += `Доход: ${s.totalIncome}\n`;
    text += `Расходы: ${s.totalExpenses}\n`;
    text += `Баланс: ${s.balance}\n`;
    text += `Норма сбережений: ${s.savingsRate}%\n\n`;

    text += `РАСХОДЫ ПО КАТЕГОРИЯМ:\n`;
    for (const [cat, amount] of Object.entries(s.expensesByCategory)) {
      text += `- ${cat}: ${amount}\n`;
    }

    text += `\nДОХОДЫ ПО КАТЕГОРИЯМ:\n`;
    for (const [cat, amount] of Object.entries(s.incomeByCategory)) {
      text += `- ${cat}: ${amount}\n`;
    }

    text += `\nСЧЕТА:\n`;
    s.accountSummary.forEach((acc) => {
      text += `- ${acc.name}: ${acc.balance} ${acc.currency}\n`;
    });

    text += `\nМЕСЯЧНАЯ РАЗБИВКА:\n`;
    s.monthlyBreakdown.forEach((m) => {
      text += `${m.month}: доход ${m.income}, расход ${m.expenses}, баланс ${m.balance}\n`;
    });

    return text;
  }
}
