import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class AuthDto {
  @IsEmail({}, { message: 'Некорректный формат email' })
  @MaxLength(254, {
    message: 'Email не должен превышать 254 символа',
  })
  email: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, {
    message: 'Пароль должен содержать не менее 6 символов',
  })
  @MaxLength(128, {
    message: 'Пароль не должен превышать 128 символов',
  })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[^\s]{6,128}$/, {
    message:
      'Пароль должен содержать хотя бы одну букву и одну цифру, и не должен содержать пробелы',
  })
  password: string;
}
