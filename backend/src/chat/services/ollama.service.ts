import { Injectable, Logger } from '@nestjs/common';
import { FinancialDataService } from './financial-data.service';
import { AnalysisIntentService } from './analysis/analysis-intent.service';
import { AnalysisPeriodService } from './analysis/analysis-period.service';
import { AnalysisPromptService } from './analysis/analysis-prompt.service';
import { AnalysisData, AnalysisPeriodSource, StreamChunk } from '../interfaces/analysis.interface';

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly url: string = process.env.OLLAMA_URL || 'http://ollama:11434';
  private readonly model: string = process.env.OLLAMA_MODEL || 'financial-advisor';

  constructor(
    private readonly intent: AnalysisIntentService,
    private readonly period: AnalysisPeriodService,
    private readonly fin: FinancialDataService,
    private readonly prompt: AnalysisPromptService
  ) {}

  async *generateStreamResponse(
    message: string,
    userId: string
  ): AsyncGenerator<string, void, unknown> {
    let data: AnalysisData | null = null;

    if (this.intent.isAnalysis(message)) {
      const { start, end, source } = this.period.extract(message);

      if (source === AnalysisPeriodSource.NO_PERIOD) {
        yield 'Вы не указали период анализа. Укажите, за какой срок провести анализ: месяц, прошлый месяц, квартал, год или диапазон дат.';
        return;
      }

      this.logger.debug(
        `Analysis source: ${source}, period: ${start.toISOString()} - ${end.toISOString()}`
      );

      const summary = await this.fin.getFinancialSummary(userId, start, end);
      data = {
        period: summary.period,
        summary: summary.summary,
      };
    }

    if (data == null) {
      this.logger.warn('No analysis data available for message');
      yield `Вы не указали нужное действие. Напишите, что вам нужно: сводка, оптимизация, анализ?`;
      return;
    }

    const userPrompt: string = this.prompt.build(data, message);

    // ДОБАВЬТЕ ЭТО:
    this.logger.log(`📝 PROMPT SENT TO LLM:\n${userPrompt.substring(0, 500)}...`);

    const response = await fetch(`${this.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: true,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('Stream not available');

    let buffer = '';
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;

      buffer += decoder.decode(chunk.value);
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        try {
          const json: StreamChunk = JSON.parse(line);
          if (json.message?.content) yield json.message.content;
        } catch {
          // Skip invalid JSON lines
        }
      }
    }
  }
}
