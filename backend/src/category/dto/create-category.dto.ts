import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CurrencyCode } from '../../common/enums/currency.enum';

export class CreateCategoryDto {
  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty()
  @MaxLength(11, { message: 'Имя не должно превышать 11 символов' })
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
