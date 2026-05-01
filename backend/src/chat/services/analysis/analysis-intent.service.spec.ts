import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisIntentService } from './analysis-intent.service';

describe('AnalysisIntentService', () => {
  let service: AnalysisIntentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalysisIntentService],
    }).compile();

    service = module.get<AnalysisIntentService>(AnalysisIntentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isAnalysis', () => {
    it('should return true for messages containing "анализ"', () => {
      const messages = [
        'сделай анализ расходов',
        'анализ финансов',
        'нужен анализ',
        'проведи анализ',
      ];

      messages.forEach((msg) => {
        expect(service.isAnalysis(msg)).toBe(true);
      });
    });

    it('should return true for messages containing "расход"', () => {
      const messages = [
        'покажи расходы',
        'мои расходы за месяц',
        'расходы по категориям',
        'какие у меня расходы',
      ];

      messages.forEach((msg) => {
        expect(service.isAnalysis(msg)).toBe(true);
      });
    });

    it('should return true for messages containing "доход"', () => {
      const messages = ['сколько доходов', 'доходы за год', 'покажи доходы', 'мои доходы'];

      messages.forEach((msg) => {
        expect(service.isAnalysis(msg)).toBe(true);
      });
    });

    it('should return true for messages containing "отчет"', () => {
      const messages = ['сформируй отчет', 'отчет по финансам', 'нужен отчет', 'финансовый отчет'];

      messages.forEach((msg) => {
        expect(service.isAnalysis(msg)).toBe(true);
      });
    });

    it('should return true for messages containing "финанс"', () => {
      const messages = [
        'финансовый анализ',
        'мои финансы',
        'финансовое состояние',
        'финансы за месяц',
      ];

      messages.forEach((msg) => {
        expect(service.isAnalysis(msg)).toBe(true);
      });
    });

    it('should return true for messages containing "бюджет"', () => {
      const messages = ['анализ бюджета', 'мой бюджет', 'бюджет на месяц', 'как соблюдать бюджет'];

      messages.forEach((msg) => {
        expect(service.isAnalysis(msg)).toBe(true);
      });
    });

    it('should return false for non-analysis messages', () => {
      const messages = [
        'привет',
        'как дела',
        'помощь',
        'создать категорию',
        'добавить транзакцию',
        'удалить счет',
        'настройки',
        'профиль',
      ];

      messages.forEach((msg) => {
        expect(service.isAnalysis(msg)).toBe(false);
      });
    });

    it('should be case insensitive', () => {
      const messages = ['АНАЛИЗ', 'Анализ', 'аНаЛиЗ', 'РАСХОДЫ', 'Расходы', 'рАсХоДы', 'ДоходЫ'];

      messages.forEach((msg) => {
        expect(service.isAnalysis(msg)).toBe(true);
      });
    });

    it('should handle empty string', () => {
      expect(service.isAnalysis('')).toBe(false);
    });

    it('should handle messages with mixed cyrillic and latin', () => {
      const messages = ['сделай analysis расходов', 'financial отчет', 'бюджет report'];

      messages.forEach((msg) => {
        expect(service.isAnalysis(msg)).toBe(true);
      });
    });
  });
});
