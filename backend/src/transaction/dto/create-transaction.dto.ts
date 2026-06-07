import { IsNumber, IsString, IsEnum, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { TransactionType } from '../enums/transaction-type.enum';
import { CurrencyCode } from '../../common/enums/currency.enum';

export class CreateTransactionDto {
  @IsNumber()
  accountId: number;

  @IsNumber()
  @IsOptional()
  targetAccountId?: number;

  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Описание не более 100 символов' })
  description?: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(CurrencyCode)
  currencyCode: CurrencyCode;

  @IsDateString()
  @IsOptional()
  transactionDate?: string;
}
