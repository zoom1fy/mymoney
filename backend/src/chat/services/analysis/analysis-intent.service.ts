import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalysisIntentService {
  private readonly keywords: string[] = [
    'анализ',
    'расход',
    'доход',
    'отчет',
    'финанс',
    'оптимиз',
    'сводка',
    'статист',
    'эконом',
    'бюджет',
  ];

  isAnalysis(message: string): boolean {
    const m: string = message.toLowerCase();
    return this.keywords.some((k: string) => m.includes(k));
  }
}
