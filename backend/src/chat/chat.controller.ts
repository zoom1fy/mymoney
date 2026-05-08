import { Controller, Get, Delete } from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { User } from '@prisma/client';

@Auth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.chatService.findAll(user.id);
  }

  @Delete()
  clear(@CurrentUser() user: User) {
    return this.chatService.clear(user.id);
  }
}
