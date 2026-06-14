import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from './seed.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SeedService', () => {
  let service: SeedService;
  let mockPrisma: any;

  const userId = 'user-uuid-1';

  beforeEach(async () => {
    mockPrisma = {
      category: { create: jest.fn() },
      account: { create: jest.fn() },
      transaction: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);

    mockPrisma.category.create
      .mockResolvedValueOnce({ id: 1, name: 'Зарплата' })
      .mockResolvedValueOnce({ id: 2, name: 'Фриланс' })
      .mockResolvedValueOnce({ id: 3, name: 'Продукты' })
      .mockResolvedValueOnce({ id: 4, name: 'Транспорт' });

    mockPrisma.account.create
      .mockResolvedValueOnce({ id: 1, name: 'Наличные' })
      .mockResolvedValueOnce({ id: 2, name: 'Копилка' });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('seedNewUser()', () => {
    it('should create categories, accounts, and transactions for a new user', async () => {
      await service.seedNewUser(userId);

      expect(mockPrisma.category.create).toHaveBeenCalledTimes(4);
      expect(mockPrisma.account.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.transaction.create).toHaveBeenCalledTimes(3);

      expect(mockPrisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId, name: 'Зарплата' }) })
      );
      expect(mockPrisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId, name: 'Продукты' }) })
      );
    });

    it('should create accounts with currencyCode RUB', async () => {
      await service.seedNewUser(userId);

      expect(mockPrisma.account.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ currencyCode: 'RUB' }) })
      );
    });

    it('should create transactions referencing correct account and category', async () => {
      await service.seedNewUser(userId);

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            accountId: 1,
            categoryId: 1,
            amount: 100000,
            type: 'INCOME',
          }),
        })
      );
    });
  });
});
