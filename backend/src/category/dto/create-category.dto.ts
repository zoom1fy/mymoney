import {
  IsBoolean,
  IsEnum,
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

  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

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
