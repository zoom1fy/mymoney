import {
  Transaction,
  Account,
  Category,
  Currency,
  AccountCategory,
  AccountType,
} from '@prisma/client';

// Типы для включенных связей
export type TransactionWithRelations = Transaction & {
  category: Category | null;
  account: Account & {
    currency: Currency;
    category: AccountCategory;
    type: AccountType;
  };
  currency: Currency;
};

export type AccountWithRelations = Account & {
  currency: Currency;
  category: AccountCategory;
  type: AccountType;
};

export type CategoryWithRelations = Category & {
  currency: Currency;
};

export interface AccountSummary {
  id: number;
  name: string;
  type: string;
  category: string;
  currency: string;
  balance: number;
}

export interface MonthlyBreakdown {
  month: string;
  income: number;
  expenses: number;
  count: number;
  balance: number;
}

export interface CategoryAmount {
  category: string;
  amount: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: string;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  expensesByCategory: Record<string, number>;
  incomeByCategory: Record<string, number>;
  accountSummary: AccountSummary[];
  monthlyBreakdown: MonthlyBreakdown[];
  topExpenseCategories: CategoryAmount[];
  topIncomeCategories: CategoryAmount[];
  averageDailyExpense: string;
}

export interface MonthlyGroup {
  income: number;
  expenses: number;
  count: number;
}

export interface PeriodInfo {
  start: string;
  end: string;
}

export interface FinancialDataResponse {
  period: PeriodInfo;
  summary: FinancialSummary;
  rawData: {
    transactions: TransactionWithRelations[];
    accounts: AccountWithRelations[];
    categories: CategoryWithRelations[];
  };
}
