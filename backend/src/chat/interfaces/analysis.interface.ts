import { FinancialSummary } from './financial-data.interface';

export interface AnalysisData {
  period: {
    start: string;
    end: string;
  };
  summary: FinancialSummary;
}

export enum AnalysisPeriodSource {
  PREVIOUS_MONTH = 'previous_month',
  CURRENT_MONTH = 'current_month',
  SPECIFIC_MONTH = 'specific_month',
  LAST_X_MONTHS = 'last_x_months',
  LAST_X_DAYS = 'last_x_days',
  PREVIOUS_YEAR = 'previous_year',
  SPECIFIC_YEAR = 'specific_year',
  RANGE = 'range',
  NO_PERIOD = 'no_period',
  FALLBACK_CURRENT_MONTH = 'fallback_current_month',
}

export interface AnalysisPeriod {
  start: Date;
  end: Date;
  source: AnalysisPeriodSource;
}

export interface StreamChunk {
  message?: {
    content?: string;
  };
}
