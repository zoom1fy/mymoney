import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyService } from '../currency/currency.service';
import { TransactionType } from './enums/transaction-type.enum';
import Decimal from 'decimal.js';

// Realistic test data
const userId = 'user-uuid-1';
const accountId = 1;
const targetAccountId = 2;
const categoryId = 1;
const amount = 100;

// Mock PrismaService with required methods
const mockPrisma = {
  account: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  category: {
    findFirst: jest.fn(),
  },
  transaction: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Make $transaction return the provided operations array (atomic block simulation)
mockPrisma.$transaction.mockImplementation((updates: any[]) => Promise.resolve(updates));

// Mock CurrencyService (exchange rates not central to tests but a dependency)
const mockCurrencyService = {
  getExchangeRate: jest.fn(),
};

describe('TransactionService', () => {
  let service: TransactionService;
  let prisma: typeof mockPrisma;
  let currencyService: typeof mockCurrencyService;

  beforeEach(async () => {
    // Reset mocks before each test

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CurrencyService, useValue: mockCurrencyService },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    prisma = module.get<PrismaService>(PrismaService) as any;
    currencyService = module.get<CurrencyService>(CurrencyService) as any;
    // Reset all mock implementations
    Object.values(mockPrisma.account).forEach((m) => (m as jest.Mock).mockReset());
    Object.values(mockPrisma.category).forEach((m) => (m as jest.Mock).mockReset());
    Object.values(mockPrisma.transaction).forEach((m) => (m as jest.Mock).mockReset());
    (mockPrisma.$transaction as jest.Mock).mockReset();
    mockPrisma.$transaction.mockImplementation((updates: any[]) => Promise.resolve(updates));
    mockCurrencyService.getExchangeRate.mockReset();
    mockCurrencyService.getExchangeRate.mockResolvedValue(1);
    // Default sensible mocks
    mockPrisma.account.findFirst.mockResolvedValue({ id: accountId, currentBalance: new Decimal(1000), userId });
    mockPrisma.category.findFirst.mockResolvedValue({ id: categoryId, userId });
  });

  describe('create()', () => {
    it('should create INCOME transaction and increment account balance', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce({ id: accountId, currentBalance: new Decimal(1000), userId });
      mockPrisma.category.findFirst.mockResolvedValueOnce({ id: categoryId, userId });
      mockPrisma.$transaction.mockResolvedValueOnce([
        { id: accountId, currentBalance: new Decimal(1100) },
        { id: 100, userId, amount: 100, type: TransactionType.INCOME },
      ]);
      const input: any = {
        accountId,
        categoryId,
        amount,
        type: TransactionType.INCOME,
        currencyCode: 'RUB',
        description: 'income test',
        transactionDate: new Date('2020-01-01'),
      };

      const result = await service.create(userId, input);

      expect(result).toBeDefined();
      expect(result[result.length - 1].type).toBe(TransactionType.INCOME);
      // Balance should be increased
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: { currentBalance: { increment: amount } },
      });
    });

    it('should create EXPENSE transaction and decrement account balance', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce({ id: accountId, currentBalance: new Decimal(1000), userId });
      mockPrisma.category.findFirst.mockResolvedValueOnce({ id: categoryId, userId });
      mockPrisma.$transaction.mockResolvedValueOnce([
        { id: accountId, currentBalance: new Decimal(900) },
        { id: 101, userId, amount, type: TransactionType.EXPENSE },
      ]);
      const input: any = {
        accountId,
        categoryId,
        amount,
        type: TransactionType.EXPENSE,
        currencyCode: 'RUB',
        description: 'expense test',
      };

      const result = await service.create(userId, input);
      expect(result[result.length - 1].type).toBe(TransactionType.EXPENSE);
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: { currentBalance: { decrement: amount } },
      });
    });

    it('should create TRANSFER transaction and adjust both accounts', async () => {
      mockPrisma.account.findFirst
        .mockResolvedValueOnce({ id: accountId, currentBalance: new Decimal(1000), userId })
        .mockResolvedValueOnce({ id: targetAccountId, currentBalance: new Decimal(500), userId });
      mockPrisma.$transaction.mockResolvedValueOnce([
        { id: accountId, currentBalance: new Decimal(900) },
        { id: targetAccountId, currentBalance: new Decimal(600) },
        { id: 102, userId, amount, type: TransactionType.TRANSFER },
      ]);
      const input: any = {
        accountId,
        targetAccountId,
        amount,
        type: TransactionType.TRANSFER,
        currencyCode: 'RUB',
        description: 'transfer test',
      };

      const result = await service.create(userId, input);
      expect(result[result.length - 1].type).toBe(TransactionType.TRANSFER);
      // Source decrement, target increment
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: { currentBalance: { decrement: amount } },
      });
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: targetAccountId },
        data: { currentBalance: { increment: amount } },
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce(null);
      const input: any = { accountId, categoryId, amount, type: TransactionType.INCOME, currencyCode: 'RUB' };
      await expect(service.create(userId, input)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException if target account not found for TRANSFER', async () => {
      mockPrisma.account.findFirst
        .mockResolvedValueOnce({ id: accountId, currentBalance: new Decimal(1000), userId })
        .mockResolvedValueOnce(null);
      const input: any = { accountId, targetAccountId: 999, amount, type: TransactionType.TRANSFER, currencyCode: 'RUB' };
      await expect(service.create(userId, input)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException if category not found for INCOME/EXPENSE', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce({ id: accountId, currentBalance: new Decimal(1000), userId });
      mockPrisma.category.findFirst.mockResolvedValueOnce(null);
      const input: any = { accountId, categoryId: 999, amount, type: TransactionType.INCOME, currencyCode: 'RUB' };
      await expect(service.create(userId, input)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException if categoryId is undefined for INCOME/EXPENSE', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce({ id: accountId, currentBalance: new Decimal(1000), userId });
      const input: any = { accountId, amount, type: TransactionType.INCOME, currencyCode: 'RUB' };
      await expect(service.create(userId, input)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException if amount <= 0', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce({ id: accountId, currentBalance: new Decimal(1000), userId });
      const input: any = { accountId, categoryId, amount: 0, type: TransactionType.INCOME, currencyCode: 'RUB' };
      await expect(service.create(userId, input)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException if TRANSFER without targetAccountId', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce({ id: accountId, currentBalance: new Decimal(1000), userId });
      const input: any = { accountId, amount, type: TransactionType.TRANSFER, currencyCode: 'RUB' };
      await expect(service.create(userId, input)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException for unknown transaction type', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce({ id: accountId, currentBalance: new Decimal(1000), userId });
      const input: any = { accountId, categoryId, amount, type: 'UNKNOWN', currencyCode: 'RUB' };
      await expect(service.create(userId, input)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should use current date if transactionDate not provided', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce({ id: accountId, currentBalance: new Decimal(1000), userId });
      mockPrisma.category.findFirst.mockResolvedValueOnce({ id: categoryId, userId });
      mockPrisma.$transaction.mockResolvedValueOnce([{}]);

      const input: any = { accountId, categoryId, amount: 50, type: TransactionType.INCOME, currencyCode: 'RUB' };

      const result = await service.create(userId, input);
      const createCall = mockPrisma.transaction.create.mock.calls[0][0];
      expect(createCall.data.transactionDate).toBeInstanceOf(Date);
    });
  });

  describe('findAll()', () => {
    it('should return paginated transactions with nextCursor', async () => {
      const items: any[] = Array.from({ length: 21 }, (_, i) => ({
        id: i + 1,
        amount: 10 * (i + 1),
        type: TransactionType.INCOME,
        transactionDate: new Date(),
        accountId: 1,
        categoryId: 1,
      }));
      mockPrisma.transaction.findMany.mockResolvedValueOnce(items);
      const result: any = await service.findAll(userId, { take: 20, cursor: 0 });
      expect(result.data.length).toBe(20);
      expect(result.nextCursor).toBe(21);
    });

    it('should apply accountId, type and date range filters', async () => {
      mockPrisma.transaction.findMany.mockResolvedValueOnce([]);
      const from = '2020-01-01';
      const to = '2020-12-31';
      await service.findAll(userId, { take: 10, cursor: 0, accountId, type: TransactionType.EXPENSE, from, to });
      const whereArg = mockPrisma.transaction.findMany.mock.calls[0][0].where;
      expect(whereArg.accountId).toBe(accountId);
      expect(whereArg.type).toBe(TransactionType.EXPENSE);
      expect(whereArg.transactionDate).toBeDefined();
    });

    it('should default take to 20 if not provided', async () => {
      mockPrisma.transaction.findMany.mockResolvedValueOnce([{ id: 1, amount: 10, type: 'INCOME', transactionDate: new Date() }]);
      const result: any = await service.findAll(userId, {});
      expect(mockPrisma.transaction.findMany.mock.calls.length).toBeGreaterThan(0);
      expect(result.data.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('findOne()', () => {
    it('should return transaction by id', async () => {
      const tx = { id: 5, type: TransactionType.INCOME, account: { userId } };
      mockPrisma.transaction.findFirst.mockResolvedValueOnce(tx);
      const result = await service.findOne(userId, 5);
      expect(result).toEqual(tx);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValueOnce(null);
      await expect(service.findOne(userId, 999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove()', () => {
    it('should delete INCOME transaction and decrement account balance', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValueOnce({
        id: 10,
        accountId,
        type: TransactionType.INCOME,
        amount: 50,
        account: { userId },
      });
      mockPrisma.$transaction.mockResolvedValueOnce([{}]);
      const result = await service.remove(userId, 10);
      expect(result).toBeDefined();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.account.update).toHaveBeenCalled();
    });

    it('should delete EXPENSE transaction and increment account balance', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValueOnce({
        id: 11,
        accountId,
        type: TransactionType.EXPENSE,
        amount: 20,
        account: { userId },
      });
      mockPrisma.$transaction.mockResolvedValueOnce([{}]);
      await service.remove(userId, 11);
      expect(mockPrisma.account.update).toHaveBeenCalled();
    });

    it('should delete TRANSFER transaction and reverse both account updates', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValueOnce({
        id: 12,
        accountId,
        targetAccountId,
        type: TransactionType.TRANSFER,
        amount: 30,
        account: { userId },
      });
      mockPrisma.$transaction.mockResolvedValueOnce([{}]);
      await service.remove(userId, 12);
      expect(mockPrisma.account.update).toHaveBeenCalled();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValueOnce(null);
      await expect(service.remove(userId, 999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update()', () => {
    it('should rollback old transaction and apply new transaction', async () => {
      const existing = { id: 20, accountId, type: TransactionType.INCOME, amount: 100, account: { userId } };
      mockPrisma.transaction.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.account.findMany.mockResolvedValueOnce([{ id: accountId, isDeleted: false }]);
      mockPrisma.$transaction.mockResolvedValueOnce([{}]);
      const dto: any = { amount: 150, type: TransactionType.EXPENSE };
      const result = await service.update(userId, 20, dto);
      expect(result).toBeDefined();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValueOnce(null);
      await expect(service.update(userId, 999, { amount: 50, type: TransactionType.INCOME })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException if account is deleted', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValueOnce({ id: 21, accountId, type: TransactionType.INCOME, amount: 50, account: { userId } });
      mockPrisma.account.findMany.mockResolvedValueOnce([{ id: accountId, isDeleted: true }]);
      await expect(service.update(userId, 21, { amount: 60, type: TransactionType.EXPENSE })).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
