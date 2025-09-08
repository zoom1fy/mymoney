import { IsBoolean, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrencyCode } from '../../common/enums/currency.enum';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  name: string;

  @IsEnum(CurrencyCode)
  currencyCode: CurrencyCode;

  @IsBoolean()
  isExpense: boolean;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}
