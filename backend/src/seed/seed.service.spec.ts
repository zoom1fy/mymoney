import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from './seed.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaDbMock } from '../prisma/fluent-mock';

describe('SeedService', () => {
  let service: SeedService;
  let dbMock: ReturnType<typeof createPrismaDbMock>;

  const userId = 'user-uuid-1';

  beforeEach(async () => {
    dbMock = createPrismaDbMock();

    dbMock.orm.Category.create
      .mockResolvedValueOnce({ id: 1, name: 'Зарплата' })
      .mockResolvedValueOnce({ id: 2, name: 'Фриланс' })
      .mockResolvedValueOnce({ id: 3, name: 'Продукты' })
      .mockResolvedValueOnce({ id: 4, name: 'Транспорт' });

    dbMock.orm.Account.create
      .mockResolvedValueOnce({ id: 1, name: 'Наличные' })
      .mockResolvedValueOnce({ id: 2, name: 'Копилка' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [SeedService, { provide: PrismaService, useValue: { db: dbMock.db } }],
    }).compile();

    service = module.get<SeedService>(SeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('seedNewUser()', () => {
    it('should create categories, accounts, and transactions for a new user', async () => {
      await service.seedNewUser(userId);

      expect(dbMock.orm.Category.create).toHaveBeenCalledTimes(4);
      expect(dbMock.orm.Account.create).toHaveBeenCalledTimes(2);
      expect(dbMock.orm.Transaction.create).toHaveBeenCalledTimes(3);

      expect(dbMock.orm.Category.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId, name: 'Зарплата' })
      );
      expect(dbMock.orm.Category.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId, name: 'Продукты' })
      );
    });

    it('should seed reference data (currencies, account categories/types) before user data', async () => {
      await service.seedNewUser(userId);

      expect(dbMock.orm.Currency.upsert).toHaveBeenCalledTimes(16);
      expect(dbMock.orm.Currency.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          conflictOn: { code: 'RUB' },
          create: expect.objectContaining({ code: 'RUB', type: 'FIAT' }),
        })
      );
      expect(dbMock.orm.AccountCategory.upsert).toHaveBeenCalledTimes(4);
      expect(dbMock.orm.AccountType.upsert).toHaveBeenCalledTimes(6);
    });

    it('should create accounts with currencyCode RUB', async () => {
      await service.seedNewUser(userId);

      expect(dbMock.orm.Account.create).toHaveBeenCalledWith(
        expect.objectContaining({ currencyCode: 'RUB' })
      );
    });

    it('should create transactions referencing correct account and category', async () => {
      await service.seedNewUser(userId);

      expect(dbMock.orm.Transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          accountId: 1,
          categoryId: 1,
          amount: '100000',
          type: 'INCOME',
        })
      );
    });
  });
});
