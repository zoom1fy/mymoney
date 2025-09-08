import { IsOptional, IsString, IsNotEmpty, MaxLength, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyCode } from '../../common/enums/currency.enum';
import { AccountCategoryEnum } from '../enums/account-category.enum';
import { AccountTypeEnum } from '../enums/account-type.enum';
import { MaxDigits } from '../decorators/max-digits.decorator';

export class CreateAccountDto {
  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Имя не должно быть пустым' })
  @MaxLength(15, { message: 'Имя не должно превышать 15 символов' })
  name: string;

  @IsEnum(AccountCategoryEnum)
  categoryId: AccountCategoryEnum;

  @IsEnum(AccountTypeEnum)
  typeId: AccountTypeEnum;

  @IsEnum(CurrencyCode)
  currencyCode: CurrencyCode;

  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'Баланс должен быть числом с максимум двумя знаками после запятой' }
  )
  @MaxDigits(9, { message: 'Баланс не должен превышать 9 цифр' })
  @Type(() => Number)
  currentBalance?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}
