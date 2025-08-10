import { IsInt, IsOptional, IsString, IsIn, IsNotEmpty, MaxLength, IsEnum } from 'class-validator';
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
  @IsString()
  @MaxLength(50)
  icon?: string;
}
