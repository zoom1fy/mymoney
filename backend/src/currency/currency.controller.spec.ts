import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';

describe('CurrencyController', () => {
  let controller: CurrencyController;
  let mockCurrencyService: any;

  beforeEach(async () => {
    mockCurrencyService = {
      findAll: jest.fn(),
      getExchangeRate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurrencyController],
      providers: [{ provide: CurrencyService, useValue: mockCurrencyService }],
    }).compile();

    controller = module.get<CurrencyController>(CurrencyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll()', () => {
    it('should return all currencies from service', async () => {
      const expected = [
        { code: 'RUB', name: 'Российский рубль', symbol: '₽', type: 'FIAT' },
        { code: 'USD', name: 'Доллар США', symbol: '$', type: 'FIAT' },
      ];
      mockCurrencyService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();

      expect(mockCurrencyService.findAll).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });
});
