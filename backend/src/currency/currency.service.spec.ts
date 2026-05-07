import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { BadRequestException } from '@nestjs/common';
import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let mockHttpService: Partial<HttpService>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        { provide: HttpService, useValue: mockHttpService },
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

    it('should fetch RUB -> USD from CBR API and return Value / Nominal', async () => {
      (mockHttpService.get as jest.Mock).mockReturnValue(of({ data: mockApiResponse }));
      const rate = await service.getExchangeRate('RUB', 'USD');
      expect(rate).toBe(90.5);
      expect(mockHttpService.get).toHaveBeenCalledTimes(1);
      expect(mockHttpService.get).toHaveBeenCalledWith('https://www.cbr-xml-daily.ru/daily_json.js');
    });

    it('should fetch RUB -> EUR and return Value / Nominal', async () => {
      (mockHttpService.get as jest.Mock).mockReturnValue(of({ data: mockApiResponse }));
      const rate = await service.getExchangeRate('RUB', 'EUR');
      expect(rate).toBe(98.2);
    });

    it('should calculate inverse rate: USD -> RUB', async () => {
      (mockHttpService.get as jest.Mock).mockReturnValue(of({ data: mockApiResponse }));
      const rate = await service.getExchangeRate('USD', 'RUB');
      // 1 / (Value / Nominal) = 1 / 90.5
      expect(rate).toBeCloseTo(1 / 90.5, 6);
    });

    it('should calculate inverse rate: EUR -> RUB', async () => {
      (mockHttpService.get as jest.Mock).mockReturnValue(of({ data: mockApiResponse }));
      const rate = await service.getExchangeRate('EUR', 'RUB');
      expect(rate).toBeCloseTo(1 / 98.2, 6);
    });

    it('should calculate cross-rate USD -> EUR via RUB using three API calls', async () => {
      jest.clearAllMocks();
      (mockHttpService.get as jest.Mock).mockReturnValue(of({ data: mockApiResponse }));
      const rate = await service.getExchangeRate('USD', 'EUR');
      // Top-level call fetches rates, then recursive calls: USD->RUB (fetches), RUB->EUR (fetches)
      expect(rate).toBeCloseTo(98.2 / 90.5, 6);
      expect(mockHttpService.get).toHaveBeenCalledTimes(3);
    });

    it('should throw BadRequestException if currency not found (RUB -> GBP)', async () => {
      const incompleteApiResponse = {
        Valute: {
          USD: { Value: 90.5, Nominal: 1 },
        },
      };
      (mockHttpService.get as jest.Mock).mockReturnValue(of({ data: incompleteApiResponse }));
      await expect(service.getExchangeRate('RUB', 'GBP')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException if currency not found (GBP -> RUB)', async () => {
      const incompleteApiResponse = {
        Valute: {
          USD: { Value: 90.5, Nominal: 1 },
        },
      };
      (mockHttpService.get as jest.Mock).mockReturnValue(of({ data: incompleteApiResponse }));
      await expect(service.getExchangeRate('GBP', 'RUB')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should handle custom Nominal value', async () => {
      const responseWithNominal = {
        Valute: {
          JPY: { Value: 0.6, Nominal: 10 },
        },
      };
      (mockHttpService.get as jest.Mock).mockReturnValue(of({ data: responseWithNominal }));
      const rate = await service.getExchangeRate('RUB', 'JPY');
      expect(rate).toBe(0.6 / 10);
    });
  });
});
