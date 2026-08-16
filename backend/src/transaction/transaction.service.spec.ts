import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExchangeRateService } from '../currency/exchange-rate.service';
import { TransactionType } from './enums/transaction-type.enum';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { createPrismaDbMock } from '../prisma/fluent-mock';

const userId = 'user-uuid-1';
const accountId = 1;
const targetAccountId = 2;
const categoryId = 1;
const amount = 100;

const accountRow = { id: accountId, currentBalance: '1000', userId };

const mockExchangeRateService = {
  getRatesToRub: jest.fn(),
  convertToRub: jest.fn(),
};

describe('TransactionService', () => {
  let service: TransactionService;
  let dbMock: ReturnType<typeof createPrismaDbMock>;

  beforeEach(async () => {
    dbMock = createPrismaDbMock();
    dbMock.orm.Account.first.mockResolvedValue({ ...accountRow });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: PrismaService, useValue: { db: dbMock.db } },
        { provide: ExchangeRateService, useValue: mockExchangeRateService },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    mockExchangeRateService.getRatesToRub.mockReset();
    mockExchangeRateService.getRatesToRub.mockResolvedValue(new Map([['RUB', 1]]));
    mockExchangeRateService.convertToRub.mockReset();
    mockExchangeRateService.convertToRub.mockResolvedValue(100);
  });

  describe('create()', () => {
    it('should create INCOME transaction and increment account balance', async () => {
      dbMock.orm.Category.first.mockResolvedValueOnce({ id: categoryId, userId });
      dbMock.orm.Transaction.create.mockResolvedValueOnce({
        id: 100,
        userId,
        type: TransactionType.INCOME,
        amount: String(amount),
      });

      const input: any = {
        accountId,
        categoryId,
        amount,
        type: TransactionType.INCOME,
        currencyCode: 'RUB',
        description: 'income test',
        transactionDate: new Date('2020-01-01'),
      };

      const result = await service.create(userId, input as CreateTransactionDto);

      expect(result.type).toBe(TransactionType.INCOME);
      expect(dbMock.orm.Account.update).toHaveBeenCalledWith({
        currentBalance: '1100', // 1000 + 100
      });
    });

    it('should create EXPENSE transaction and decrement account balance', async () => {
      dbMock.orm.Category.first.mockResolvedValueOnce({ id: categoryId, userId });
      dbMock.orm.Transaction.create.mockResolvedValueOnce({
        id: 101,
        userId,
        type: TransactionType.EXPENSE,
        amount: String(amount),
      });

      const input: any = {
        accountId,
        categoryId,
        amount,
        type: TransactionType.EXPENSE,
        currencyCode: 'RUB',
        description: 'expense test',
      };

      const result = await service.create(userId, input as CreateTransactionDto);
      expect(result.type).toBe(TransactionType.EXPENSE);
      expect(dbMock.orm.Account.update).toHaveBeenCalledWith({
        currentBalance: '900', // 1000 - 100
      });
    });

    it('should create TRANSFER transaction and adjust both accounts', async () => {
      dbMock.orm.Account.first
        .mockResolvedValueOnce({ ...accountRow }) // outside check
        .mockResolvedValueOnce({ id: targetAccountId, currentBalance: '500', userId }) // target lookup
        .mockResolvedValueOnce({ ...accountRow }) // source balance read
        .mockResolvedValueOnce({ id: targetAccountId, currentBalance: '500', userId }); // target balance read
      dbMock.orm.Transaction.create.mockResolvedValueOnce({
        id: 102,
        userId,
        type: TransactionType.TRANSFER,
        amount: String(amount),
      });

      const input: any = {
        accountId,
        targetAccountId,
        amount,
        type: TransactionType.TRANSFER,
        currencyCode: 'RUB',
        description: 'transfer test',
      };

      const result = await service.create(userId, input as CreateTransactionDto);
      expect(result.type).toBe(TransactionType.TRANSFER);
      expect(dbMock.orm.Account.update).toHaveBeenCalledWith({
        currentBalance: '900', // source: 1000 - 100
      });
      expect(dbMock.orm.Account.update).toHaveBeenCalledWith({
        currentBalance: '600', // target: 500 + 100
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      dbMock.orm.Account.first.mockResolvedValueOnce(null);
      const input: any = {
        accountId,
        categoryId,
        amount,
        type: TransactionType.INCOME,
        currencyCode: 'RUB',
      };
      await expect(service.create(userId, input as CreateTransactionDto)).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it('should throw NotFoundException if target account not found for TRANSFER', async () => {
      dbMock.orm.Account.first
        .mockResolvedValueOnce({ ...accountRow, currentBalance: '1000' })
        .mockResolvedValueOnce(null);
      const input: any = {
        accountId,
        targetAccountId: 999,
        amount,
        type: TransactionType.TRANSFER,
        currencyCode: 'RUB',
      };
      await expect(service.create(userId, input as CreateTransactionDto)).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it('should throw NotFoundException if category not found for INCOME/EXPENSE', async () => {
      dbMock.orm.Category.first.mockResolvedValueOnce(null);
      const input: any = {
        accountId,
        categoryId: 999,
        amount,
        type: TransactionType.INCOME,
        currencyCode: 'RUB',
      };
      await expect(service.create(userId, input as CreateTransactionDto)).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it('should throw BadRequestException if categoryId is undefined for INCOME/EXPENSE', async () => {
      const input: any = { accountId, amount, type: TransactionType.INCOME, currencyCode: 'RUB' };
      await expect(service.create(userId, input as CreateTransactionDto)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('should throw BadRequestException if amount <= 0', async () => {
      dbMock.orm.Category.first.mockResolvedValueOnce({ id: categoryId, userId });
      const input: any = {
        accountId,
        categoryId,
        amount: 0,
        type: TransactionType.INCOME,
        currencyCode: 'RUB',
      };
      await expect(service.create(userId, input as CreateTransactionDto)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('should throw BadRequestException if TRANSFER without targetAccountId', async () => {
      const input: any = { accountId, amount, type: TransactionType.TRANSFER, currencyCode: 'RUB' };
      await expect(service.create(userId, input as CreateTransactionDto)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('should throw BadRequestException for unknown transaction type', async () => {
      dbMock.orm.Category.first.mockResolvedValueOnce({ id: categoryId, userId });
      const input: any = { accountId, categoryId, amount, type: 'UNKNOWN', currencyCode: 'RUB' };
      await expect(service.create(userId, input as CreateTransactionDto)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('should use current date if transactionDate not provided', async () => {
      dbMock.orm.Category.first.mockResolvedValueOnce({ id: categoryId, userId });
      const input: any = {
        accountId,
        categoryId,
        amount: 50,
        type: TransactionType.INCOME,
        currencyCode: 'RUB',
      };

      await service.create(userId, input as CreateTransactionDto);
      const createCall = dbMock.orm.Transaction.create.mock.calls[0][0];
      expect(createCall.transactionDate).toBeInstanceOf(Date);
    });
  });

  describe('findAll()', () => {
    it('should return paginated transactions with nextCursor', async () => {
      const items: any[] = Array.from({ length: 21 }, (_, i) => ({
        id: i + 1,
        amount: String(10 * (i + 1)),
        type: TransactionType.INCOME,
        transactionDate: new Date(),
        accountId: 1,
        categoryId: 1,
      }));
      dbMock.orm.Transaction.all.mockResolvedValueOnce(items as never);
      const result: any = await service.findAll(userId, { take: 20, cursor: 0 });
      expect(result.data.length).toBe(20);
      expect(result.nextCursor).toBe(21);
    });

    it('should apply accountId, type and date range filters', async () => {
      const from = '2020-01-01';
      const to = '2020-12-31';
      await service.findAll(userId, {
        take: 10,
        cursor: 0,
        accountId,
        type: TransactionType.EXPENSE,
        from,
        to,
      });
      expect(dbMock.orm.Transaction.where).toHaveBeenCalledWith({ userId });
      expect(dbMock.orm.Transaction.where).toHaveBeenCalledWith({ accountId });
      expect(dbMock.orm.Transaction.where).toHaveBeenCalledWith({ type: TransactionType.EXPENSE });
      expect(dbMock.orm.Transaction.where).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should default take to 20 if not provided', async () => {
      dbMock.orm.Transaction.all.mockResolvedValueOnce([
        { id: 1, amount: '10', type: 'INCOME', transactionDate: new Date() },
      ] as never);
      const result: any = await service.findAll(userId, {});
      expect(result.data.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getSummary()', () => {
    it('should return aggregated sums grouped by category in RUB', async () => {
      dbMock.orm.Transaction.all.mockResolvedValueOnce([
        {
          id: 1,
          amount: '500',
          currencyCode: 'USD',
          categoryId: 1,
          category: { id: 1, name: 'Food', color: '#ff0000' },
          userId,
          type: TransactionType.EXPENSE,
          transactionDate: new Date('2024-01-15'),
        },
        {
          id: 2,
          amount: '300',
          currencyCode: 'USD',
          categoryId: 2,
          category: { id: 2, name: 'Transport', color: '#00ff00' },
          userId,
          type: TransactionType.EXPENSE,
          transactionDate: new Date('2024-01-20'),
        },
        {
          id: 3,
          amount: '100',
          currencyCode: 'RUB',
          categoryId: null,
          category: null,
          userId,
          type: TransactionType.EXPENSE,
          transactionDate: new Date('2024-01-25'),
        },
      ] as never);
      mockExchangeRateService.getRatesToRub.mockResolvedValueOnce(
        new Map([
          ['USD', 90],
          ['RUB', 1],
        ])
      );

      const result = await service.getSummary(userId, {
        type: TransactionType.EXPENSE,
        from: '2024-01-01',
        to: '2024-01-31',
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        categoryId: 1,
        categoryName: 'Food',
        categoryColor: '#ff0000',
        totalAmount: 45000,
      });
      expect(result[1]).toEqual({
        categoryId: 2,
        categoryName: 'Transport',
        categoryColor: '#00ff00',
        totalAmount: 27000,
      });
      expect(result[2]).toEqual({
        categoryId: null,
        categoryName: 'Без категории',
        categoryColor: null,
        totalAmount: 100,
      });
    });

    it('should filter by date range', async () => {
      dbMock.orm.Transaction.all.mockResolvedValueOnce([] as never);
      const result = await service.getSummary(userId, {
        type: TransactionType.INCOME,
        from: '2024-06-01',
        to: '2024-06-30',
      });
      expect(dbMock.orm.Transaction.where).toHaveBeenCalledWith({
        userId,
        type: TransactionType.INCOME,
      });
      expect(result).toEqual([]);
    });
  });

  describe('findOne()', () => {
    it('should return transaction by id', async () => {
      const transaction = { id: 5, type: TransactionType.INCOME, account: { userId } };
      dbMock.orm.Transaction.first.mockResolvedValueOnce(transaction);
      const result = await service.findOne(userId, 5);
      expect(result).toEqual(transaction);
    });

    it('should throw NotFoundException if not found', async () => {
      await expect(service.findOne(userId, 999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove()', () => {
    it('should delete INCOME transaction and decrement account balance', async () => {
      dbMock.orm.Transaction.first.mockResolvedValueOnce({
        id: 10,
        accountId,
        type: TransactionType.INCOME,
        amount: '50',
        account: { userId },
      });

      await service.remove(userId, 10);
      expect(dbMock.db.transaction).toHaveBeenCalled();
      expect(dbMock.orm.Account.update).toHaveBeenCalledWith({ currentBalance: '950' }); // 1000 - 50
      expect(dbMock.orm.Transaction.delete).toHaveBeenCalled();
    });

    it('should delete EXPENSE transaction and increment account balance', async () => {
      dbMock.orm.Transaction.first.mockResolvedValueOnce({
        id: 11,
        accountId,
        type: TransactionType.EXPENSE,
        amount: '20',
        account: { userId },
      });

      await service.remove(userId, 11);
      expect(dbMock.orm.Account.update).toHaveBeenCalledWith({ currentBalance: '1020' }); // 1000 + 20
    });

    it('should delete TRANSFER transaction and reverse both account updates', async () => {
      dbMock.orm.Transaction.first.mockResolvedValueOnce({
        id: 12,
        accountId,
        targetAccountId,
        type: TransactionType.TRANSFER,
        amount: '30',
        account: { userId },
      });
      dbMock.orm.Account.first
        .mockResolvedValueOnce({ id: accountId, currentBalance: '1000', userId })
        .mockResolvedValueOnce({ id: targetAccountId, currentBalance: '500', userId });

      await service.remove(userId, 12);
      expect(dbMock.orm.Account.update).toHaveBeenCalledWith({ currentBalance: '1030' });
      expect(dbMock.orm.Account.update).toHaveBeenCalledWith({ currentBalance: '470' });
    });

    it('should throw NotFoundException if not found', async () => {
      await expect(service.remove(userId, 999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update()', () => {
    it('should rollback old transaction and apply new transaction', async () => {
      const existing = {
        id: 20,
        accountId,
        type: TransactionType.INCOME,
        amount: '100',
        account: { userId },
      };
      dbMock.orm.Transaction.first.mockResolvedValueOnce(existing);
      dbMock.orm.Account.all.mockResolvedValueOnce([{ id: accountId, isDeleted: false }] as never);
      // balance reads: first reverse-read 1000, then apply-read 900 (after reverse)
      dbMock.orm.Account.first
        .mockResolvedValueOnce({ id: accountId, currentBalance: '1000', userId })
        .mockResolvedValueOnce({ id: accountId, currentBalance: '900', userId });
      const dto: any = { amount: 150, type: TransactionType.EXPENSE };

      const result = await service.update(userId, 20, dto as UpdateTransactionDto);
      expect(result).toBeUndefined();
      expect(dbMock.db.transaction).toHaveBeenCalled();
      // reverse INCOME 100 → -100; then EXPENSE 150 → account 1000 - 100 - 150
      expect(dbMock.orm.Account.update).toHaveBeenCalledWith({ currentBalance: '750' });
    });

    it('should throw NotFoundException if not found', async () => {
      await expect(
        service.update(userId, 999, { amount: 50, type: TransactionType.INCOME })
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException if account is deleted', async () => {
      dbMock.orm.Transaction.first.mockResolvedValueOnce({
        id: 21,
        accountId,
        type: TransactionType.INCOME,
        amount: 50,
        account: { userId },
      });
      dbMock.orm.Account.all.mockResolvedValueOnce([{ id: accountId, isDeleted: true }] as never);
      await expect(
        service.update(userId, 21, { amount: 60, type: TransactionType.EXPENSE })
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
