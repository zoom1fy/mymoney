import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { TransactionType } from './enums/transaction-type.enum';
import { User } from '@prisma/client';

describe('TransactionController', () => {
  let controller: TransactionController;
  let mockTransactionService: any;

  const mockUser = { id: 'user-uuid-1' } as User;

  beforeEach(async () => {
    mockTransactionService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [{ provide: TransactionService, useValue: mockTransactionService }],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('should call transactionService.create with user id and dto', async () => {
      const dto = { accountId: 1, amount: 100, type: TransactionType.INCOME, currencyCode: 'RUB' as any };
      const expected = { id: 1, amount: 100 };
      mockTransactionService.create.mockResolvedValue(expected);

      const result = await controller.create(mockUser, dto);

      expect(mockTransactionService.create).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll()', () => {
    it('should call transactionService.findAll with user id and query', async () => {
      const query = { take: 20, cursor: 0 };
      const expected = { data: [], nextCursor: null };
      mockTransactionService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(mockUser, query);

      expect(mockTransactionService.findAll).toHaveBeenCalledWith(mockUser.id, query);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne()', () => {
    it('should call transactionService.findOne with user id and numeric id', async () => {
      const expected = { id: 1, amount: 100 };
      mockTransactionService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(mockUser, '1');

      expect(mockTransactionService.findOne).toHaveBeenCalledWith(mockUser.id, 1);
      expect(result).toEqual(expected);
    });
  });

  describe('update()', () => {
    it('should call transactionService.update with user id, numeric id, and dto', async () => {
      const dto = { amount: 150 };
      const expected = { id: 1, amount: 150 };
      mockTransactionService.update.mockResolvedValue(expected);

      const result = await controller.update(mockUser, '1', dto);

      expect(mockTransactionService.update).toHaveBeenCalledWith(mockUser.id, 1, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('remove()', () => {
    it('should call transactionService.remove with user id and numeric id', async () => {
      mockTransactionService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockUser, '1');

      expect(mockTransactionService.remove).toHaveBeenCalledWith(mockUser.id, 1);
      expect(result).toBeUndefined();
    });
  });
});
