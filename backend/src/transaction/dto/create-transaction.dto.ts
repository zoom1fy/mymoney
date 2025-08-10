import { IsNumber, IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { TransactionType } from '../enums/transaction-type.enum';
import { CurrencyCode } from '../../common/enums/currency.enum';

export class CreateTransactionDto {
  @IsNumber()
  accountId: number;

  @IsNumber()
  @IsOptional()
  targetAccountId?: number;

  @IsNumber()
  categoryId?: number;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(CurrencyCode)
  currencyCode: CurrencyCode;
}
