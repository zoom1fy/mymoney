import { IsEmail, IsString, Length, MinLength, MaxLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'Код должен содержать 6 цифр' })
  code: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен содержать не менее 6 символов' })
  @MaxLength(128, { message: 'Пароль не должен превышать 128 символов' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[^\s]{6,128}$/, {
    message: 'Пароль должен содержать хотя бы одну букву и одну цифру, без пробелов',
  })
  password: string;
}
