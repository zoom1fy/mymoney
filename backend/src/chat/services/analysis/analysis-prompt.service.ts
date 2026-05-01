import { Injectable } from '@nestjs/common';
import { AnalysisData } from 'src/chat/interfaces/analysis.interface';

@Injectable()
export class AnalysisPromptService {
  build(finData: AnalysisData, userMessage: string): string {
    const safeMessage = userMessage.trim() === '' ? '""' : userMessage;

    return `
      ДАННЫЕ:
      ${JSON.stringify(finData, null, 2)}

      ВОПРОС ПОЛЬЗОВАТЕЛЯ:
      ${safeMessage}
    `.trim();
  }
}
