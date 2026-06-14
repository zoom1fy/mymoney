import { Test, TestingModule } from '@nestjs/testing';
import { OllamaService } from './ollama.service';
import { FinancialDataService } from './financial-data.service';
import { AnalysisIntentService } from './analysis/analysis-intent.service';
import { AnalysisPeriodService } from './analysis/analysis-period.service';
import { AnalysisPromptService } from './analysis/analysis-prompt.service';
import { AnalysisPeriodSource } from '../interfaces/analysis.interface';

describe('OllamaService', () => {
  let service: OllamaService;
  let mockIntent: any;
  let mockPeriod: any;
  let mockFin: any;
  let mockPrompt: any;

  beforeEach(async () => {
    mockIntent = { isAnalysis: jest.fn() };
    mockPeriod = { extract: jest.fn() };
    mockFin = { getFinancialSummary: jest.fn() };
    mockPrompt = { build: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaService,
        { provide: AnalysisIntentService, useValue: mockIntent },
        { provide: AnalysisPeriodService, useValue: mockPeriod },
        { provide: FinancialDataService, useValue: mockFin },
        { provide: AnalysisPromptService, useValue: mockPrompt },
      ],
    }).compile();

    service = module.get<OllamaService>(OllamaService);
  });

  describe('generateStreamResponse()', () => {
    it('should yield period-required message when no period in message', async () => {
      mockIntent.isAnalysis.mockReturnValue(true);
      mockPeriod.extract.mockReturnValue({ source: AnalysisPeriodSource.NO_PERIOD });

      const generator = service.generateStreamResponse('анализ', 'user-1');
      const result: string[] = [];

      for await (const chunk of generator) {
        result.push(chunk);
      }

      expect(result).toEqual(['Вы не указали период анализа. Укажите, за какой срок провести анализ: месяц, прошлый месяц, квартал, год или диапазон дат.']);
    });

    it('should yield unknown action message when not analysis', async () => {
      mockIntent.isAnalysis.mockReturnValue(false);
      mockPeriod.extract.mockReturnValue({ source: AnalysisPeriodSource.CURRENT_MONTH, start: new Date(), end: new Date() });

      const generator = service.generateStreamResponse('привет', 'user-1');
      const result: string[] = [];

      for await (const chunk of generator) {
        result.push(chunk);
      }

      expect(result).toEqual(['Вы не указали нужное действие. Напишите, что вам нужно: сводка, оптимизация, анализ?']);
    });

    it('should yield unknown action message when data is null', async () => {
      mockIntent.isAnalysis.mockReturnValue(false);

      const generator = service.generateStreamResponse('привет', 'user-1');
      const result: string[] = [];

      for await (const chunk of generator) {
        result.push(chunk);
      }

      expect(result).toEqual(['Вы не указали нужное действие. Напишите, что вам нужно: сводка, оптимизация, анализ?']);
    });
  });
});
