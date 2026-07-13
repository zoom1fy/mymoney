import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  // Required for any profile change — verifies the user's identity before applying updates
  @IsString()
  currentPassword!: string;
}
