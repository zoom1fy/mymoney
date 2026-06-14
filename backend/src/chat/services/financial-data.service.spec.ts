import { Test, TestingModule } from '@nestjs/testing';
import { FinancialDataService } from './financial-data.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FinancialSummary, TransactionWithRelations } from '../interfaces/financial-data.interface';

describe('FinancialDataService', () => {
  let service: FinancialDataService;
  let mockPrisma: any;

  const mockTransactions: any[] = [
    {
      id: 1, amount: 100000, type: 'INCOME',
      transactionDate: new Date('2024-01-05'),
      category: { name: 'Зарплата' },
      account: { id: 1, name: 'Наличные', currentBalance: 150000, currency: { symbol: '₽' }, category: { name: 'bank' }, type: { name: 'cash' } },
      currency: { symbol: '₽' },
    },
    {
      id: 2, amount: 15000, type: 'EXPENSE',
      transactionDate: new Date('2024-01-10'),
      category: { name: 'Продукты' },
      account: { id: 1, name: 'Наличные', currentBalance: 150000, currency: { symbol: '₽' }, category: { name: 'bank' }, type: { name: 'cash' } },
      currency: { symbol: '₽' },
    },
    {
      id: 3, amount: 5000, type: 'EXPENSE',
      transactionDate: new Date('2024-01-15'),
      category: { name: 'Транспорт' },
      account: { id: 1, name: 'Наличные', currentBalance: 150000, currency: { symbol: '₽' }, category: { name: 'bank' }, type: { name: 'cash' } },
      currency: { symbol: '₽' },
    },
  ];

  const mockAccounts: any[] = [
    { id: 1, name: 'Наличные', currentBalance: 150000, currency: { symbol: '₽' }, category: { name: 'bank' }, type: { name: 'cash' } },
    { id: 2, name: 'Копилка', currentBalance: 20000, currency: { symbol: '₽' }, category: { name: 'savings' }, type: { name: 'deposit' } },
  ];

  const mockCategories: any[] = [
    { id: 1, name: 'Зарплата', currency: { symbol: '₽' } },
    { id: 2, name: 'Продукты', currency: { symbol: '₽' } },
  ];

  beforeEach(async () => {
    mockPrisma = {
      $queryRawUnsafe: jest.fn(),
      transaction: { findMany: jest.fn() },
      account: { findMany: jest.fn() },
      category: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialDataService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FinancialDataService>(FinancialDataService);
  });

  describe('formatForAI()', () => {
    it('should format financial data into readable text', () => {
      const summary: FinancialSummary = {
        totalIncome: 100000,
        totalExpenses: 75000,
        balance: 25000,
        savingsRate: '25.0',
        transactionCount: 50,
        incomeCount: 10,
        expenseCount: 40,
        expensesByCategory: { food: 30000, transport: 15000, entertainment: 30000 },
        incomeByCategory: { salary: 90000, freelance: 10000 },
        accountSummary: [
          { id: 1, name: 'Наличные', type: 'cash', category: 'bank', currency: '₽', balance: 150000 },
        ],
        monthlyBreakdown: [
          { month: '2024-01', income: 100000, expenses: 75000, count: 50, balance: 25000 },
        ],
        topExpenseCategories: [
          { category: 'food', amount: 30000 },
          { category: 'entertainment', amount: 30000 },
        ],
        topIncomeCategories: [{ category: 'salary', amount: 90000 }],
        averageDailyExpense: '2419.35',
      };

      const result = service.formatForAI({ summary });

      expect(result).toContain('Доход: 100000');
      expect(result).toContain('Расходы: 75000');
      expect(result).toContain('food: 30000');
      expect(result).toContain('salary: 90000');
      expect(result).toContain('Наличные: 150000 ₽');
      expect(result).toContain('Норма сбережений: 25.0%');
    });

    it('should handle empty data', () => {
      const summary: FinancialSummary = {
        totalIncome: 0, totalExpenses: 0, balance: 0, savingsRate: '0',
        transactionCount: 0, incomeCount: 0, expenseCount: 0,
        expensesByCategory: {}, incomeByCategory: {},
        accountSummary: [], monthlyBreakdown: [],
        topExpenseCategories: [], topIncomeCategories: [],
        averageDailyExpense: '0',
      };

      const result = service.formatForAI({ summary });

      expect(result).toContain('Доход: 0');
      expect(result).toContain('Расходы: 0');
    });
  });

  describe('getFinancialSummary()', () => {
    it('should fetch and return financial summary', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);
      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrisma.account.findMany.mockResolvedValue(mockAccounts);
      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');

      const result = await service.getFinancialSummary('user-uuid-1', start, end);

      expect(result.period.start).toBe(start.toISOString());
      expect(result.period.end).toBe(end.toISOString());
      expect(result.summary.totalIncome).toBe(100000);
      expect(result.summary.totalExpenses).toBe(20000);
      expect(result.summary.balance).toBe(80000);
      expect(result.summary.transactionCount).toBe(3);
      expect(result.summary.accountSummary).toHaveLength(2);
    });
  });
});
