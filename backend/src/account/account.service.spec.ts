import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';

import { AccountService } from './account.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AccountService', () => {
  let service: AccountService;
  let mockPrisma: any;

  const userId = 'user-uuid-1';

  beforeEach(async () => {
    mockPrisma = {
      account: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AccountService>(AccountService);
    Object.values(mockPrisma.account as Record<string, jest.Mock>).forEach((mock) => {
      mock.mockReset();
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should create account with all fields', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);
      mockPrisma.account.create.mockResolvedValue({
        id: 1,
        userId,
        name: 'Savings',
        currentBalance: new Decimal(120.5),
        icon: 'wallet',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: { symbol: '₽' },
      });

      const dto = {
        name: 'Savings',
        categoryId: 'bank' as any,
        typeId: 'bank' as any,
        currencyCode: 'RUB' as any,
        currentBalance: 120.5,
        icon: 'wallet',
      };

      const result = await service.create(userId, dto);

      expect(result).toBeDefined();
      expect(mockPrisma.account.findFirst).toHaveBeenCalledWith({
        where: { userId, name: 'Savings', isDeleted: false },
      });
      const createArg = mockPrisma.account.create.mock.calls[0][0];
      expect(createArg.data.userId).toBe(userId);
      expect(createArg.data.name).toBe('Savings');
      expect(createArg.data.icon).toBe('wallet');
      expect(createArg.data.currentBalance).toBeInstanceOf(Decimal);
      expect(Number(createArg.data.currentBalance)).toBeCloseTo(120.5);
    });

    it('should throw BadRequestException if account with same name already exists (not deleted)', async () => {
      mockPrisma.account.findFirst.mockResolvedValue({
        id: 10,
        userId,
        name: 'Savings',
        isDeleted: false,
        currentBalance: new Decimal(0),
      });

      await expect(
        service.create(userId, {
          name: 'Savings',
          categoryId: 'bank' as any,
          typeId: 'bank' as any,
          currencyCode: 'RUB' as any,
        })
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should default icon to "default" when not provided', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);
      mockPrisma.account.create.mockResolvedValue({
        id: 3,
        userId,
        name: 'New',
        currentBalance: new Decimal(0),
        icon: 'default',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: { symbol: '₽' },
      });

      await service.create(userId, {
        name: 'New',
        categoryId: 'bank' as any,
        typeId: 'bank' as any,
        currencyCode: 'RUB' as any,
      });
      const createArg = mockPrisma.account.create.mock.calls[0][0];
      expect(createArg.data.icon).toBe('default');
    });

    it('should default currentBalance to Decimal(0) if undefined', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);
      mockPrisma.account.create.mockResolvedValue({
        id: 4,
        userId,
        name: 'Empty',
        currentBalance: new Decimal(0),
        icon: 'default',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: { symbol: '₽' },
      });

      await service.create(userId, {
        name: 'Empty',
        categoryId: 'bank' as any,
        typeId: 'bank' as any,
        currencyCode: 'RUB' as any,
      });
      const createArg = mockPrisma.account.create.mock.calls[0][0];
      expect(createArg.data.currentBalance).toBeInstanceOf(Decimal);
      expect(Number(createArg.data.currentBalance)).toBeCloseTo(0);
    });

    it('should default NaN currentBalance to 0', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);
      mockPrisma.account.create.mockResolvedValue({
        id: 5,
        userId,
        name: 'NaN',
        currentBalance: new Decimal(0),
        icon: 'default',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: { symbol: '₽' },
      });

      await service.create(userId, {
        name: 'NaN',
        currentBalance: NaN,
        categoryId: 'bank' as any,
        typeId: 'bank' as any,
        currencyCode: 'RUB' as any,
      });
      const createArg = mockPrisma.account.create.mock.calls[0][0];
      expect(createArg.data.currentBalance).toBeInstanceOf(Decimal);
      expect(Number(createArg.data.currentBalance)).toBeCloseTo(0);
    });
  });

  describe('findAll()', () => {
    it('should return non-deleted accounts and convert balance to Number, ordered asc by createdAt', async () => {
      const firstAccount = {
        id: 1,
        userId,
        name: 'A',
        isDeleted: false,
        currentBalance: new Decimal(10),
        icon: 'default',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date(),
        currency: { symbol: '₽' },
      };
      mockPrisma.account.findMany.mockResolvedValue([firstAccount]);

      const result = await service.findAll(userId);
      expect(result.length).toBe(1);
      expect(result[0].isDeleted).toBeFalsy();
      expect(typeof result[0].currentBalance).toBe('number');
      expect(result[0].currentBalance).toBe(10);
      expect(mockPrisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, isDeleted: false },
          orderBy: { createdAt: 'asc' },
        })
      );
    });
  });

  describe('findOne()', () => {
    it('should return account with Number balance', async () => {
      const account = {
        id: 1,
        userId,
        name: 'A',
        isDeleted: false,
        currentBalance: new Decimal(25),
        icon: 'default',
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: { symbol: '₽' },
      };
      mockPrisma.account.findFirst.mockResolvedValue(account);
      const result = await service.findOne(userId, 1);
      expect(result.currentBalance).toBe(25);
      expect(result.currencySymbol).toBe('₽');
    });

    it('should throw NotFoundException if account not found', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);
      await expect(service.findOne(userId, 999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update()', () => {
    it('should update account fields', async () => {
      const existing = {
        id: 1,
        userId,
        name: 'A',
        isDeleted: false,
        currentBalance: new Decimal(50),
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: { symbol: '₽' },
      };
      mockPrisma.account.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.account.findFirst.mockResolvedValueOnce(null);
      mockPrisma.account.update.mockResolvedValue({
        ...existing,
        name: 'A+',
        currentBalance: new Decimal(60),
      });

      const result = await service.update(userId, 1, { name: 'A+', currentBalance: 60 });
      expect(result.name).toBe('A+');
      expect(mockPrisma.account.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if new name conflicts with another account', async () => {
      const existing = {
        id: 1,
        userId,
        name: 'A',
        isDeleted: false,
        currentBalance: new Decimal(50),
        currency: { symbol: '₽' },
      };
      mockPrisma.account.findFirst.mockResolvedValueOnce(existing).mockResolvedValueOnce({
        id: 2,
        userId,
        name: 'B',
        isDeleted: false,
        currentBalance: new Decimal(20),
      });

      await expect(service.update(userId, 1, { name: 'B' })).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('should skip name check if name unchanged', async () => {
      const existing = {
        id: 1,
        userId,
        name: 'A',
        isDeleted: false,
        currentBalance: new Decimal(50),
        currency: { symbol: '₽' },
      };
      mockPrisma.account.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.account.update.mockResolvedValue({ ...existing });

      const result = await service.update(userId, 1, { name: 'A' });
      expect(result.name).toBe('A');
    });

    it('should convert Decimal for currentBalance if provided', async () => {
      const existing = {
        id: 1,
        userId,
        name: 'A',
        isDeleted: false,
        currentBalance: new Decimal(50),
        currency: { symbol: '₽' },
      };
      mockPrisma.account.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.account.update.mockResolvedValue({ ...existing, currentBalance: new Decimal(75) });

      const result = await service.update(userId, 1, { currentBalance: 75 });
      // update() returns raw Prisma result; Decimal is converted by client
      expect(Number(result.currentBalance)).toBe(75);
    });
  });

  describe('remove()', () => {
    it('should soft-delete (isDeleted: true)', async () => {
      const existing = {
        id: 1,
        userId,
        name: 'A',
        isDeleted: false,
        currentBalance: new Decimal(50),
        currency: { symbol: '₽' },
      };
      mockPrisma.account.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.account.update.mockResolvedValue({ ...existing, isDeleted: true });

      const result = await service.remove(userId, 1);
      expect(mockPrisma.account.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isDeleted: true }) })
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if account not found', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);
      await expect(service.remove(userId, 999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
