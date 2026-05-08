import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MessageRole } from '@prisma/client';

export class CreateChatMessageDto {
  @IsEnum(MessageRole)
  role!: MessageRole;

  @IsString()
  content!: string;
}

export class SendMessageDto {
  @IsString()
  @MaxLength(2000)
  text!: string;

  @IsOptional()
  tempId?: string;
}
