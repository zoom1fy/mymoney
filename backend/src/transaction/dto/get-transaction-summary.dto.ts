import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TransactionType } from '../enums/transaction-type.enum';

export class GetTransactionSummaryDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
