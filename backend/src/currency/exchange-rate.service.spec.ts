import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateService } from './exchange-rate.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyService } from './currency.service';

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;
  let mockPrisma: any;
  let mockCurrencyService: any;

  beforeEach(async () => {
    mockPrisma = {
      exchangeRate: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
    };

    mockCurrencyService = {
      getExchangeRate: jest.fn(),
    };

    jest.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
        { provide: PrismaService, useValue: mockPrisma },
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
      expect(mockPrisma.exchangeRate.findUnique).not.toHaveBeenCalled();
    });

    it('should multiply amount by stored rate', async () => {
      mockPrisma.exchangeRate.findUnique.mockResolvedValueOnce({ from: 'USD', to: 'RUB', rate: 90.5 });
      const result = await service.convertToRub(100, 'USD');
      expect(result).toBe(9050);
    });

    it('should live-fetch rate if not in DB', async () => {
      mockPrisma.exchangeRate.findUnique.mockResolvedValueOnce(null);
      mockCurrencyService.getExchangeRate.mockResolvedValueOnce(95);
      mockPrisma.exchangeRate.upsert.mockResolvedValueOnce({});
      const result = await service.convertToRub(100, 'GBP');
      expect(result).toBe(9500);
      expect(mockCurrencyService.getExchangeRate).toHaveBeenCalledWith('GBP', 'RUB');
      expect(mockPrisma.exchangeRate.upsert).toHaveBeenCalled();
    });

    // When both DB and live API are unavailable, preserve the original amount.
    it('should return amount as-is if live fetch also fails', async () => {
      mockPrisma.exchangeRate.findUnique.mockResolvedValueOnce(null);
      mockCurrencyService.getExchangeRate.mockRejectedValueOnce(new Error('API down'));
      const result = await service.convertToRub(100, 'XYZ');
      expect(result).toBe(100);
    });
  });

  describe('getRatesToRub()', () => {
    it('should return map with RUB=1 and cached rates', async () => {
      mockPrisma.exchangeRate.findMany.mockResolvedValueOnce([
        { from: 'USD', to: 'RUB', rate: 90.5 },
        { from: 'EUR', to: 'RUB', rate: 98.2 },
      ]);
      const result = await service.getRatesToRub(['USD', 'EUR', 'RUB']);
      expect(result.get('RUB')).toBe(1);
      expect(result.get('USD')).toBe(90.5);
      expect(result.get('EUR')).toBe(98.2);
      expect(result.size).toBe(3);
    });

    it('should live-fetch missing currencies', async () => {
      mockPrisma.exchangeRate.findMany.mockResolvedValueOnce([
        { from: 'USD', to: 'RUB', rate: 90 },
      ]);
      mockCurrencyService.getExchangeRate.mockResolvedValueOnce(0.011);
      mockPrisma.exchangeRate.upsert.mockResolvedValueOnce({});
      const result = await service.getRatesToRub(['USD', 'BTC']);
      expect(result.get('RUB')).toBe(1);
      expect(result.get('USD')).toBe(90);
      expect(result.get('BTC')).toBe(0.011);
      expect(mockCurrencyService.getExchangeRate).toHaveBeenCalledWith('BTC', 'RUB');
    });

    // Omit currencies whose rates cannot be resolved from either DB or API.
    it('should skip missing currencies when live fetch fails', async () => {
      mockPrisma.exchangeRate.findMany.mockResolvedValueOnce([]);
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
      mockPrisma.exchangeRate.upsert.mockResolvedValue({});

      await service.syncRates();

      expect(mockCurrencyService.getExchangeRate).toHaveBeenCalledWith('USD', 'RUB');
      expect(mockCurrencyService.getExchangeRate).toHaveBeenCalledWith('EUR', 'RUB');
      expect(mockPrisma.exchangeRate.upsert).toHaveBeenCalled();
    });

    // Individual API failures should not prevent other currencies from syncing.
    it('should skip currencies that throw', async () => {
      mockCurrencyService.getExchangeRate.mockRejectedValue(new Error('API down'));
      mockPrisma.exchangeRate.upsert.mockResolvedValue({});

      await service.syncRates();

      expect(mockPrisma.exchangeRate.upsert).not.toHaveBeenCalled();
    });
  });
});
