import { Module } from '@nestjs/common';
import { AnalysisIntentService } from './analysis-intent.service';
import { AnalysisPeriodService } from './analysis-period.service';
import { AnalysisPromptService } from './analysis-prompt.service';

@Module({
  providers: [AnalysisIntentService, AnalysisPeriodService, AnalysisPromptService],
  exports: [AnalysisIntentService, AnalysisPeriodService, AnalysisPromptService],
})
export class AnalysisModule {}
