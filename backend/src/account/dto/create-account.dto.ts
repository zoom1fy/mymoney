import {
  IsInt,
  IsOptional,
  IsString,
  IsIn,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer'; // Add class-transformer
import { CurrencyCode } from '../../common/enums/currency.enum';
import { AccountCategoryEnum } from '../enums/account-category.enum';
import { AccountTypeEnum } from '../enums/account-type.enum';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEnum(AccountCategoryEnum)
  categoryId: AccountCategoryEnum;

  @IsEnum(AccountTypeEnum)
  typeId: AccountTypeEnum;

  @IsEnum(CurrencyCode)
  currencyCode: CurrencyCode;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Type(() => Number) // Ensure string-to-number conversion
  currentBalance?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}
