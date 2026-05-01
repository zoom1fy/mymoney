import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisPromptService } from './analysis-prompt.service';
import { AnalysisData } from 'src/chat/interfaces/analysis.interface';

describe('AnalysisPromptService', () => {
  let service: AnalysisPromptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalysisPromptService],
    }).compile();

    service = module.get<AnalysisPromptService>(AnalysisPromptService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('build', () => {
    const mockAnalysisData: AnalysisData = {
      period: {
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-01-31T23:59:59.999Z',
      },
      summary: {
        totalIncome: 100000,
        totalExpenses: 75000,
        balance: 25000,
        savingsRate: '25%',
        transactionCount: 50,
        incomeCount: 10,
        expenseCount: 40,
        expensesByCategory: {
          food: 30000,
          transport: 15000,
          entertainment: 30000,
        },
        incomeByCategory: {
          salary: 90000,
          freelance: 10000,
        },
        accountSummary: [],
        monthlyBreakdown: [],
        topExpenseCategories: [
          { category: 'food', amount: 30000 },
          { category: 'entertainment', amount: 30000 },
        ],
        topIncomeCategories: [{ category: 'salary', amount: 90000 }],
        averageDailyExpense: '2419.35',
      },
    };

    it('should build prompt with financial data and user message', () => {
      const userMessage = 'покажи мои расходы';
      const result = service.build(mockAnalysisData, userMessage);

      expect(result).toContain('ДАННЫЕ:');
      expect(result).toContain('ВОПРОС ПОЛЬЗОВАТЕЛЯ:');
      expect(result).toContain(userMessage);
    });

    it('should include JSON stringified data', () => {
      const userMessage = 'анализ';
      const result = service.build(mockAnalysisData, userMessage);

      expect(result).toContain('"totalIncome": 100000');
      expect(result).toContain('"totalExpenses": 75000');
      expect(result).toContain('"balance": 25000');
    });

    it('should handle empty user message', () => {
      const result = service.build(mockAnalysisData, '');

      expect(result).toContain('ДАННЫЕ:');
      expect(result).toContain('ВОПРОС ПОЛЬЗОВАТЕЛЯ:');
      expect(result).toContain('""');
    });

    it('should handle minimal data', () => {
      const minimalData: AnalysisData = {
        period: {
          start: '2024-01-01T00:00:00.000Z',
          end: '2024-01-31T23:59:59.999Z',
        },
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          savingsRate: '0',
          transactionCount: 0,
          incomeCount: 0,
          expenseCount: 0,
          expensesByCategory: {},
          incomeByCategory: {},
          accountSummary: [],
          monthlyBreakdown: [],
          topExpenseCategories: [],
          topIncomeCategories: [],
          averageDailyExpense: '0',
        },
      };

      const result = service.build(minimalData, 'тест');

      expect(result).toContain('"totalIncome": 0');
      expect(result).toContain('"transactionCount": 0');
    });

    it('should handle special characters in user message', () => {
      const userMessage = 'расходы @#$%^&*()';
      const result = service.build(mockAnalysisData, userMessage);

      expect(result).toContain(userMessage);
    });

    it('should trim result', () => {
      const userMessage = 'тест';
      const result = service.build(mockAnalysisData, userMessage);

      expect(result).toBe(result.trim());
      expect(result.startsWith(' ')).toBe(false);
      expect(result.endsWith(' ')).toBe(false);
    });

    it('should format JSON with indentation', () => {
      const userMessage = 'тест';
      const result = service.build(mockAnalysisData, userMessage);

      expect(result).toContain('\n        ');
      expect(result).toContain('  "period": {');
    });

    it('should handle long user messages', () => {
      const longMessage = 'a'.repeat(1000);
      const result = service.build(mockAnalysisData, longMessage);

      expect(result).toContain(longMessage);
      expect(result.length).toBeGreaterThan(1000);
    });
  });
});
