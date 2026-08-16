import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { AccountService } from './account.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaDbMock } from '../prisma/fluent-mock';

describe('AccountService', () => {
  let service: AccountService;
  let dbMock: ReturnType<typeof createPrismaDbMock>;

  const userId = 'user-uuid-1';

  const accountRow = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    userId,
    name: 'Savings',
    currentBalance: '120.5',
    icon: 'wallet',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    currency: { symbol: '₽' },
    ...overrides,
  });

  beforeEach(async () => {
    dbMock = createPrismaDbMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountService, { provide: PrismaService, useValue: { db: dbMock.db } }],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should create account with all fields', async () => {
      dbMock.orm.Account.create.mockResolvedValueOnce(accountRow());

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
      expect(dbMock.orm.Account.where).toHaveBeenCalledWith({
        userId,
        name: 'Savings',
        isDeleted: false,
      });
      const createArg = dbMock.orm.Account.create.mock.calls[0][0] as Record<string, unknown>;
      expect(createArg.name).toBe('Savings');
      expect(createArg.icon).toBe('wallet');
      expect(createArg.currentBalance).toBe('120.5');
      expect(result.currencySymbol).toBe('₽');
      expect(result.currentBalance).toBe(120.5);
    });

    it('should throw BadRequestException if account with same name already exists (not deleted)', async () => {
      dbMock.orm.Account.first.mockResolvedValue(accountRow());

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
      dbMock.orm.Account.create.mockResolvedValueOnce(accountRow({ icon: 'default' }));

      await service.create(userId, {
        name: 'New',
        categoryId: 'bank' as any,
        typeId: 'bank' as any,
        currencyCode: 'RUB' as any,
      });
      const createArg = dbMock.orm.Account.create.mock.calls[0][0];
      expect(createArg.icon).toBe('default');
    });

    it('should default currentBalance to "0" if undefined', async () => {
      dbMock.orm.Account.create.mockResolvedValueOnce(accountRow());

      await service.create(userId, {
        name: 'Empty',
        categoryId: 'bank' as any,
        typeId: 'bank' as any,
        currencyCode: 'RUB' as any,
      });
      const createArg = dbMock.orm.Account.create.mock.calls[0][0];
      expect(createArg.currentBalance).toBe('0');
    });

    it('should default NaN currentBalance to "0"', async () => {
      dbMock.orm.Account.create.mockResolvedValueOnce(accountRow());

      await service.create(userId, {
        name: 'NaN',
        currentBalance: NaN,
        categoryId: 'bank' as any,
        typeId: 'bank' as any,
        currencyCode: 'RUB' as any,
      });
      const createArg = dbMock.orm.Account.create.mock.calls[0][0];
      expect(createArg.currentBalance).toBe('0');
    });
  });

  describe('findAll()', () => {
    it('should return non-deleted accounts and convert balance to Number', async () => {
      dbMock.orm.Account.all.mockResolvedValueOnce([
        accountRow({ name: 'A', currentBalance: '10' }),
      ] as never);

      const result = await service.findAll(userId);
      expect(result.length).toBe(1);
      expect(result[0].isDeleted).toBeFalsy();
      expect(typeof result[0].currentBalance).toBe('number');
      expect(result[0].currentBalance).toBe(10);
      expect(dbMock.orm.Account.where).toHaveBeenCalledWith({ userId, isDeleted: false });
    });
  });

  describe('findOne()', () => {
    it('should return account with Number balance', async () => {
      dbMock.orm.Account.first.mockResolvedValueOnce(accountRow({ currentBalance: '25' }));

      const result = await service.findOne(userId, 1);
      expect(result.currentBalance).toBe(25);
      expect(result.currencySymbol).toBe('₽');
    });

    it('should throw NotFoundException if account not found', async () => {
      await expect(service.findOne(userId, 999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update()', () => {
    it('should update account fields', async () => {
      const updated = accountRow({ name: 'A+', currentBalance: '60', currency: { symbol: '₽' } });
      dbMock.orm.Account.first
        .mockResolvedValueOnce(accountRow({ name: 'A' }))
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(updated);

      const result = await service.update(userId, 1, { name: 'A+', currentBalance: 60 });
      expect(result.name).toBe('A+');
      expect(dbMock.orm.Account.update).toHaveBeenCalledWith(
        expect.objectContaining({ currentBalance: '60' })
      );
    });

    it('should throw BadRequestException if new name conflicts with another account', async () => {
      dbMock.orm.Account.first
        .mockResolvedValueOnce(accountRow({ name: 'A' }))
        .mockResolvedValueOnce(accountRow({ id: 2, name: 'B' }));

      await expect(service.update(userId, 1, { name: 'B' })).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('should skip name check if name unchanged', async () => {
      dbMock.orm.Account.first
        .mockResolvedValueOnce(accountRow({ name: 'A' }))
        .mockResolvedValueOnce(accountRow({ name: 'A' }));

      const result = await service.update(userId, 1, { name: 'A' });
      expect(result.name).toBe('A');
    });

    it('should convert Decimal for currentBalance if provided', async () => {
      dbMock.orm.Account.first
        .mockResolvedValueOnce(accountRow({ name: 'A' }))
        .mockResolvedValueOnce(accountRow({ name: 'A', currentBalance: '75' }));

      const result = await service.update(userId, 1, { currentBalance: 75 });
      expect(Number(result.currentBalance)).toBe(75);
    });
  });

  describe('remove()', () => {
    it('should soft-delete (isDeleted: true)', async () => {
      dbMock.orm.Account.first.mockResolvedValueOnce(accountRow());
      dbMock.orm.Account.update.mockResolvedValueOnce(accountRow({ isDeleted: true }));

      const result = await service.remove(userId, 1);
      expect(dbMock.orm.Account.update).toHaveBeenCalledWith({ isDeleted: true });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if account not found', async () => {
      await expect(service.remove(userId, 999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
