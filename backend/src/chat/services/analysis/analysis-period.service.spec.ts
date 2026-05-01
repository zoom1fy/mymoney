import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisPeriodService } from './analysis-period.service';

describe('AnalysisPeriodService', () => {
  let service: AnalysisPeriodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalysisPeriodService],
    }).compile();

    service = module.get<AnalysisPeriodService>(AnalysisPeriodService);
  });

  afterEach(() => {
    jest.useRealTimers(); // Восстанавливаем реальное время после каждого теста
  });

  // === ПОМОЩНАЯ ФУНКЦИЯ ДЛЯ МОКА ДАТЫ ===
  const withMockedDate = (date: Date, fn: () => void) => {
    jest.useFakeTimers();
    jest.setSystemTime(date);
    fn();
    jest.useRealTimers();
  };

  describe('extract - previous month', () => {
    it('should detect "прошлый месяц"', () => {
      withMockedDate(new Date(2024, 5, 15), () => {
        // 15 июня 2024
        const result = service.extract('покажи расходы за прошлый месяц');
        expect(result.source).toBe('previous_month');
        expect(result.start.getFullYear()).toBe(2024);
        expect(result.start.getMonth()).toBe(4); // Май
        expect(result.start.getDate()).toBe(1);
        expect(result.end.getFullYear()).toBe(2024);
        expect(result.end.getMonth()).toBe(4); // Май
        expect(result.end.getDate()).toBe(31);
      });
    });

    it('should detect "за прошлый месяц"', () => {
      withMockedDate(new Date(2024, 5, 15), () => {
        const result = service.extract('за прошлый месяц');
        expect(result.source).toBe('previous_month');
      });
    });

    it('should handle request for previous month when today is first day of month', () => {
      withMockedDate(new Date(2024, 2, 1), () => {
        // 1 марта 2024
        const result = service.extract('покажи расходы за прошлый месяц');
        expect(result.source).toBe('previous_month');
        expect(result.start.getFullYear()).toBe(2024);
        expect(result.start.getMonth()).toBe(1); // Февраль
        expect(result.start.getDate()).toBe(1);
        expect(result.end.getFullYear()).toBe(2024);
        expect(result.end.getMonth()).toBe(1); // Февраль
        expect(result.end.getDate()).toBe(29); // 2024 — високосный год
      });
    });

    it('should handle request for previous month when today is first day of year', () => {
      withMockedDate(new Date(2024, 0, 1), () => {
        // 1 января 2024
        const result = service.extract('прошлый месяц');
        expect(result.source).toBe('previous_month');
        expect(result.start.getFullYear()).toBe(2023);
        expect(result.start.getMonth()).toBe(11); // Декабрь
        expect(result.start.getDate()).toBe(1);
        expect(result.end.getFullYear()).toBe(2023);
        expect(result.end.getMonth()).toBe(11); // Декабрь
        expect(result.end.getDate()).toBe(31);
      });
    });
  });

  describe('extract - current month', () => {
    it('should detect "этот месяц"', () => {
      withMockedDate(new Date(2024, 5, 15, 12, 30), () => {
        const result = service.extract('расходы за этот месяц');
        expect(result.source).toBe('current_month');
        expect(result.start.getDate()).toBe(1);
        expect(result.start.getHours()).toBe(0);
        expect(result.start.getMinutes()).toBe(0);
        expect(result.end.getHours()).toBe(23);
        expect(result.end.getMinutes()).toBe(59);
      });
    });

    it('should detect "текущий месяц"', () => {
      withMockedDate(new Date(2024, 5, 15), () => {
        const result = service.extract('текущий месяц');
        expect(result.source).toBe('current_month');
      });
    });

    it('should handle request for current month when today is first day', () => {
      withMockedDate(new Date(2024, 2, 1), () => {
        // 1 марта 2024
        const result = service.extract('расходы за текущий месяц');
        expect(result.source).toBe('current_month');
        expect(result.start.getFullYear()).toBe(2024);
        expect(result.start.getMonth()).toBe(2); // Март
        expect(result.start.getDate()).toBe(1);
        expect(result.end.getFullYear()).toBe(2024);
        expect(result.end.getMonth()).toBe(2); // Март
        expect(result.end.getDate()).toBe(31);
      });
    });
  });

  describe('extract - last X days', () => {
    it('should handle "последние 30 дней" when today is first day', () => {
      withMockedDate(new Date(2024, 2, 1), () => {
        // 1 марта 2024
        const result = service.extract('последние 30 дней');
        expect(result.source).toBe('last_x_days');
        const expectedStart = new Date(2024, 0, 31); // 31 января 2024
        expect(result.start.getDate()).toBe(expectedStart.getDate());
        expect(result.start.getMonth()).toBe(expectedStart.getMonth());
      });
    });
  });

  describe('extract - specific month', () => {
    it('should detect January', () => {
      withMockedDate(new Date(2024, 5, 15), () => {
        const result = service.extract('январь 2024');
        expect(result.source).toBe('specific_month');
        expect(result.start.getFullYear()).toBe(2024);
        expect(result.start.getMonth()).toBe(0); // Январь
        expect(result.start.getDate()).toBe(1);
      });
    });

    it('should detect May without year', () => {
      withMockedDate(new Date(2024, 5, 15), () => {
        const result = service.extract('май');
        expect(result.source).toBe('specific_month');
        expect(result.start.getFullYear()).toBe(2024);
        expect(result.start.getMonth()).toBe(4); // Май
      });
    });

    it('should detect all months', () => {
      const months = [
        { name: 'январь', index: 0 },
        { name: 'февраль', index: 1 },
        { name: 'март', index: 2 },
        { name: 'апрель', index: 3 },
        { name: 'май', index: 4 },
        { name: 'июнь', index: 5 },
        { name: 'июль', index: 6 },
        { name: 'август', index: 7 },
        { name: 'сентябрь', index: 8 },
        { name: 'октябрь', index: 9 },
        { name: 'ноябрь', index: 10 },
        { name: 'декабрь', index: 11 },
      ];

      withMockedDate(new Date(2024, 5, 15), () => {
        months.forEach((month) => {
          const result = service.extract(month.name);
          expect(result.source).toBe('specific_month');
          expect(result.start.getMonth()).toBe(month.index);
        });
      });
    });

    it('should handle request for previous month by name when today is first day', () => {
      withMockedDate(new Date(2024, 2, 1), () => {
        // 1 марта 2024
        const result = service.extract('февраль');
        expect(result.source).toBe('specific_month');
        expect(result.start.getFullYear()).toBe(2024);
        expect(result.start.getMonth()).toBe(1); // Февраль
        expect(result.start.getDate()).toBe(1);
      });
    });
  });

  describe('extract - last X months', () => {
    it('should detect "последние 3 месяца"', () => {
      withMockedDate(new Date(2024, 5, 15), () => {
        const result = service.extract('последние 3 месяца');
        expect(result.source).toBe('last_x_months');
        const expectedStart = new Date(2024, 2, 1); // 1 марта 2024
        expect(result.start.getMonth()).toBe(expectedStart.getMonth());
        expect(result.start.getDate()).toBe(1);
      });
    });

    it('should handle "последние 3 месяца" when today is first day', () => {
      withMockedDate(new Date(2024, 2, 1), () => {
        // 1 марта 2024
        const result = service.extract('последние 3 месяца');
        expect(result.source).toBe('last_x_months');
        expect(result.start.getFullYear()).toBe(2023);
        expect(result.start.getMonth()).toBe(11); // Декабрь
        expect(result.start.getDate()).toBe(1);
        expect(result.end.getFullYear()).toBe(2024);
        expect(result.end.getMonth()).toBe(1); // Февраль
        expect(result.end.getDate()).toBe(29);
      });
    });
  });

  describe('extract - previous year', () => {
    it('should detect "прошлый год"', () => {
      withMockedDate(new Date(2024, 5, 15), () => {
        const result = service.extract('прошлый год');
        expect(result.source).toBe('previous_year');
        expect(result.start.getFullYear()).toBe(2023);
        expect(result.start.getMonth()).toBe(0); // Январь
        expect(result.start.getDate()).toBe(1);
        expect(result.end.getFullYear()).toBe(2023);
        expect(result.end.getMonth()).toBe(11); // Декабрь
        expect(result.end.getDate()).toBe(31);
      });
    });

    it('should handle "прошлый год" when today is first day of year', () => {
      withMockedDate(new Date(2024, 0, 1), () => {
        // 1 января 2024
        const result = service.extract('прошлый год');
        expect(result.source).toBe('previous_year');
        expect(result.start.getFullYear()).toBe(2023);
        expect(result.start.getMonth()).toBe(0); // Январь
        expect(result.start.getDate()).toBe(1);
        expect(result.end.getFullYear()).toBe(2023);
        expect(result.end.getMonth()).toBe(11); // Декабрь
        expect(result.end.getDate()).toBe(31);
      });
    });
  });

  describe('extract - specific year', () => {
    it('should detect year 2023', () => {
      withMockedDate(new Date(2024, 5, 15), () => {
        const result = service.extract('2023 год');
        expect(result.source).toBe('specific_year');
        expect(result.start.getFullYear()).toBe(2023);
        expect(result.start.getMonth()).toBe(0); // Январь
        expect(result.start.getDate()).toBe(1);
        expect(result.end.getFullYear()).toBe(2023);
        expect(result.end.getMonth()).toBe(11); // Декабрь
        expect(result.end.getDate()).toBe(31);
      });
    });

    it('should not confuse year with month containing year', () => {
      withMockedDate(new Date(2024, 5, 15), () => {
        const result = service.extract('январь 2024');
        expect(result.source).toBe('specific_month');
        expect(result.start.getFullYear()).toBe(2024);
        expect(result.start.getMonth()).toBe(0); // Январь
      });
    });
  });

  describe('extract - date range', () => {
    it('should detect "с 1 марта по 17 апреля"', () => {
      withMockedDate(new Date(2024, 5, 15), () => {
        const result = service.extract('с 1 марта по 17 апреля');
        expect(result.source).toBe('range');
        expect(result.start.getMonth()).toBe(2); // Март
        expect(result.start.getDate()).toBe(1);
        expect(result.end.getMonth()).toBe(3); // Апрель
        expect(result.end.getDate()).toBe(17);
      });
    });

    it('should handle complex range phrases', () => {
      withMockedDate(new Date(2024, 5, 15), () => {
        const result = service.extract('покажи расходы с 15 января по 28 февраля');
        expect(result.source).toBe('range');
        expect(result.start.getMonth()).toBe(0); // Январь
        expect(result.start.getDate()).toBe(15);
        expect(result.end.getMonth()).toBe(1); // Февраль
        expect(result.end.getDate()).toBe(28);
      });
    });

    it('should handle range that crosses month boundary on first day', () => {
      withMockedDate(new Date(2024, 2, 1), () => {
        // 1 марта 2024
        const result = service.extract('с 28 февраля по 2 марта');
        expect(result.source).toBe('range');
        expect(result.start.getFullYear()).toBe(2024);
        expect(result.start.getMonth()).toBe(1); // Февраль
        expect(result.start.getDate()).toBe(28);
        expect(result.end.getFullYear()).toBe(2024);
        expect(result.end.getMonth()).toBe(2); // Март
        expect(result.end.getDate()).toBe(2);
      });
    });
  });

  describe('extract - fallback', () => {
    it('should return current month for unknown message', () => {
      withMockedDate(new Date(2024, 5, 15, 12, 30), () => {
        const result = service.extract('какая-то непонятная фраза');
        expect(result.source).toBe('fallback_current_month');
        expect(result.start.getDate()).toBe(1);
        expect(result.start.getHours()).toBe(0);
        expect(result.end.getHours()).toBe(23);
        expect(result.end.getMinutes()).toBe(59);
      });
    });

    it('should return current month for empty message', () => {
      withMockedDate(new Date(2024, 5, 15), () => {
        const result = service.extract('');
        expect(result.source).toBe('fallback_current_month');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle mixed case', () => {
      withMockedDate(new Date(2024, 5, 15), () => {
        const result = service.extract('ПРОШЛЫЙ МЕСЯЦ');
        expect(result.source).toBe('previous_month');
      });
    });

    it('should handle extra spaces', () => {
      withMockedDate(new Date(2024, 5, 15), () => {
        const result = service.extract('  прошлый   месяц  ');
        expect(result.source).toBe('previous_month');
      });
    });

    it('should handle punctuation', () => {
      withMockedDate(new Date(2024, 5, 15), () => {
        const result = service.extract('прошлый месяц!');
        expect(result.source).toBe('previous_month');
      });
    });

    it('should set correct time boundaries', () => {
      withMockedDate(new Date(2024, 5, 15, 12, 30), () => {
        const result = service.extract('этот месяц');
        expect(result.start.getHours()).toBe(0);
        expect(result.start.getMinutes()).toBe(0);
        expect(result.start.getSeconds()).toBe(0);
        expect(result.start.getMilliseconds()).toBe(0);
        expect(result.end.getHours()).toBe(23);
        expect(result.end.getMinutes()).toBe(59);
        expect(result.end.getSeconds()).toBe(59);
        expect(result.end.getMilliseconds()).toBe(999);
      });
    });

    it('should handle request for previous month data on first day with partial month data', () => {
      withMockedDate(new Date(2024, 2, 1), () => {
        // 1 марта 2024
        const result = service.extract('покажи данные за прошлый месяц');
        expect(result.source).toBe('previous_month');
        expect(result.start.getMonth()).toBe(1); // Февраль
        expect(result.end.getMonth()).toBe(1); // Февраль
        expect(result.end.getDate()).toBe(29); // Полный месяц (високосный год)
        expect(result.start.getMonth()).not.toBe(2); // Не март
      });
    });
  });
});
