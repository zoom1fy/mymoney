import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateService } from './exchange-rate.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyService } from './currency.service';
import { createPrismaDbMock } from '../prisma/fluent-mock';

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;
  let dbMock: ReturnType<typeof createPrismaDbMock>;
  let mockCurrencyService: any;

  beforeEach(async () => {
    dbMock = createPrismaDbMock();

    mockCurrencyService = {
      getExchangeRate: jest.fn(),
    };

    jest.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
        { provide: PrismaService, useValue: { db: dbMock.db } },
        { provide: CurrencyService, useValue: mockCurrencyService },
      ],
    }).compile();

    service = module.get<ExchangeRateService>(ExchangeRateService);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('convertToRub()', () => {
    it('should return amount as-is for RUB', async () => {
      const result = await service.convertToRub(100, 'RUB');
      expect(result).toBe(100);
      expect(dbMock.orm.ExchangeRate.first).not.toHaveBeenCalled();
    });

    it('should multiply amount by stored rate', async () => {
      dbMock.orm.ExchangeRate.first.mockResolvedValueOnce({
        from: 'USD',
        to: 'RUB',
        rate: '90.5',
      });
      const result = await service.convertToRub(100, 'USD');
      expect(result).toBe(9050);
    });

    it('should live-fetch rate if not in DB', async () => {
      mockCurrencyService.getExchangeRate.mockResolvedValueOnce(95);
      dbMock.orm.ExchangeRate.upsert.mockResolvedValueOnce({});
      const result = await service.convertToRub(100, 'GBP');
      expect(result).toBe(9500);
      expect(mockCurrencyService.getExchangeRate).toHaveBeenCalledWith('GBP', 'RUB');
      expect(dbMock.orm.ExchangeRate.upsert).toHaveBeenCalled();
    });

    // When both DB and live API are unavailable, preserve the original amount.
    it('should return amount as-is if live fetch also fails', async () => {
      mockCurrencyService.getExchangeRate.mockRejectedValueOnce(new Error('API down'));
      const result = await service.convertToRub(100, 'XYZ');
      expect(result).toBe(100);
    });
  });

  describe('getRatesToRub()', () => {
    it('should return map with RUB=1 and cached rates', async () => {
      dbMock.orm.ExchangeRate.all.mockResolvedValueOnce([
        { from: 'USD', to: 'RUB', rate: '90.5' },
        { from: 'EUR', to: 'RUB', rate: '98.2' },
      ] as never);
      const result = await service.getRatesToRub(['USD', 'EUR', 'RUB']);
      expect(result.get('RUB')).toBe(1);
      expect(result.get('USD')).toBe(90.5);
      expect(result.get('EUR')).toBe(98.2);
      expect(result.size).toBe(3);
    });

    it('should live-fetch missing currencies', async () => {
      dbMock.orm.ExchangeRate.all.mockResolvedValueOnce([
        { from: 'USD', to: 'RUB', rate: '90' },
      ] as never);
      mockCurrencyService.getExchangeRate.mockResolvedValueOnce(0.011);
      dbMock.orm.ExchangeRate.upsert.mockResolvedValueOnce({});
      const result = await service.getRatesToRub(['USD', 'BTC']);
      expect(result.get('RUB')).toBe(1);
      expect(result.get('USD')).toBe(90);
      expect(result.get('BTC')).toBe(0.011);
      expect(mockCurrencyService.getExchangeRate).toHaveBeenCalledWith('BTC', 'RUB');
    });

    // Omit currencies whose rates cannot be resolved from either DB or API.
    it('should skip missing currencies when live fetch fails', async () => {
      mockCurrencyService.getExchangeRate.mockRejectedValueOnce(new Error('API down'));
      const result = await service.getRatesToRub(['GRAM']);
      expect(result.get('RUB')).toBe(1);
      expect(result.has('GRAM')).toBe(false);
      expect(result.size).toBe(1);
    });
  });

  describe('syncRates()', () => {
    it('should fetch and upsert rates for all non-RUB currencies', async () => {
      mockCurrencyService.getExchangeRate.mockImplementation((from: string) => {
        const rates: Record<string, number> = { USD: 90.5, EUR: 98.2 };
        return Promise.resolve(rates[from] ?? null);
      });
      dbMock.orm.ExchangeRate.upsert.mockResolvedValue({});

      await service.syncRates();

      expect(mockCurrencyService.getExchangeRate).toHaveBeenCalledWith('USD', 'RUB');
      expect(mockCurrencyService.getExchangeRate).toHaveBeenCalledWith('EUR', 'RUB');
      expect(dbMock.orm.ExchangeRate.upsert).toHaveBeenCalled();
    });

    // Individual API failures should not prevent other currencies from syncing.
    it('should skip currencies that throw', async () => {
      mockCurrencyService.getExchangeRate.mockRejectedValue(new Error('API down'));
      dbMock.orm.ExchangeRate.upsert.mockResolvedValue({});

      await service.syncRates();

      expect(dbMock.orm.ExchangeRate.upsert).not.toHaveBeenCalled();
    });
  });
});
