import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { BadRequestException } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let mockHttpService: Partial<HttpService>;
  let mockPrisma: any;

  const mockApiResponse = {
    Valute: {
      USD: { Value: 90.5, Nominal: 1 },
      EUR: { Value: 98.2, Nominal: 1 },
    },
  };

  beforeEach(async () => {
    mockHttpService = {
      get: jest.fn(),
    };

    mockPrisma = {
      currency: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    (mockHttpService.get as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getExchangeRate()', () => {
    it('should return 1 when from === to (same currency)', async () => {
      const rate = await service.getExchangeRate('USD', 'USD');
      expect(rate).toBe(1);
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });

    it('should return same for RUB -> RUB', async () => {
      const rate = await service.getExchangeRate('RUB', 'RUB');
      expect(rate).toBe(1);
    });

    it('should fetch RUB -> USD from CBR API and return Nominal / Value', async () => {
      (mockHttpService.get as jest.Mock).mockReturnValue(of({ data: mockApiResponse }));
      const rate = await service.getExchangeRate('RUB', 'USD');
      // 1 RUB = Nominal/Value USD = 1/90.5
      expect(rate).toBeCloseTo(1 / 90.5, 6);
      expect(mockHttpService.get).toHaveBeenCalledTimes(1);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://www.cbr-xml-daily.ru/daily_json.js'
      );
    });

    it('should fetch RUB -> EUR and return Nominal / Value', async () => {
      (mockHttpService.get as jest.Mock).mockReturnValue(of({ data: mockApiResponse }));
      const rate = await service.getExchangeRate('RUB', 'EUR');
      expect(rate).toBeCloseTo(1 / 98.2, 6);
    });

    it('should calculate direct rate: USD -> RUB', async () => {
      (mockHttpService.get as jest.Mock).mockReturnValue(of({ data: mockApiResponse }));
      const rate = await service.getExchangeRate('USD', 'RUB');
      // 1 USD = Value/Nominal RUB = 90.5
      expect(rate).toBe(90.5);
    });

    it('should calculate direct rate: EUR -> RUB', async () => {
      (mockHttpService.get as jest.Mock).mockReturnValue(of({ data: mockApiResponse }));
      const rate = await service.getExchangeRate('EUR', 'RUB');
      expect(rate).toBe(98.2);
    });

    it('should calculate cross-rate USD -> EUR via RUB using three API calls', async () => {
      jest.clearAllMocks();
      (mockHttpService.get as jest.Mock).mockReturnValue(of({ data: mockApiResponse }));
      const rate = await service.getExchangeRate('USD', 'EUR');
      // USD->RUB = 90.5, RUB->EUR = 1/98.2 => cross = 90.5/98.2
      expect(rate).toBeCloseTo(90.5 / 98.2, 6);
      expect(mockHttpService.get).toHaveBeenCalledTimes(3);
    });

    it('should throw BadRequestException if currency not found (RUB -> GBP)', async () => {
      const incompleteApiResponse = {
        Valute: {
          USD: { Value: 90.5, Nominal: 1 },
        },
      };
      (mockHttpService.get as jest.Mock).mockReturnValue(of({ data: incompleteApiResponse }));
      await expect(service.getExchangeRate('RUB', 'GBP')).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('should throw BadRequestException if currency not found (GBP -> RUB)', async () => {
      const incompleteApiResponse = {
        Valute: {
          USD: { Value: 90.5, Nominal: 1 },
        },
      };
      (mockHttpService.get as jest.Mock).mockReturnValue(of({ data: incompleteApiResponse }));
      await expect(service.getExchangeRate('GBP', 'RUB')).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('should handle custom Nominal value', async () => {
      const responseWithNominal = {
        Valute: {
          JPY: { Value: 0.6, Nominal: 10 },
        },
      };
      (mockHttpService.get as jest.Mock).mockReturnValue(of({ data: responseWithNominal }));
      const rate = await service.getExchangeRate('RUB', 'JPY');
      expect(rate).toBe(10 / 0.6);
    });

    it('should fallback to CoinGecko for BTC -> USD when CBR has no crypto', async () => {
      (mockHttpService.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('coingecko')) {
          return of({ data: { bitcoin: { usd: 67000 } } });
        }
        return of({ data: mockApiResponse });
      });

      const rate = await service.getExchangeRate('BTC', 'USD');
      expect(rate).toBe(67000);
    });

    it('should invert CoinGecko rate for USD -> BTC', async () => {
      (mockHttpService.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('coingecko')) {
          return of({ data: { bitcoin: { usd: 50000 } } });
        }
        return of({ data: mockApiResponse });
      });

      const rate = await service.getExchangeRate('USD', 'BTC');
      expect(rate).toBeCloseTo(1 / 50000, 10);
    });

    it('should fallback to Binance for BTC -> EUR when CoinGecko also fails', async () => {
      (mockHttpService.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('binance')) {
          return of({ data: { symbol: 'BTCEUR', price: '85000.50' } });
        }
        // Fail CoinGecko by returning unexpected format
        if (url.includes('coingecko')) {
          return of({ data: {} });
        }
        return of({ data: mockApiResponse });
      });

      const rate = await service.getExchangeRate('BTC', 'EUR');
      expect(rate).toBe(85000.5);
    });

    it('should invert Binance rate for EUR -> BTC', async () => {
      (mockHttpService.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('binance')) {
          return of({ data: { symbol: 'BTCEUR', price: '90000' } });
        }
        if (url.includes('coingecko')) {
          return of({ data: {} });
        }
        return of({ data: mockApiResponse });
      });

      const rate = await service.getExchangeRate('EUR', 'BTC');
      expect(rate).toBeCloseTo(1 / 90000, 10);
    });
  });
});
