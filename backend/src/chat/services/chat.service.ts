import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChatMessageDto } from '../dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateChatMessageDto) {
    return this.prisma.chatMessage.create({
      data: {
        userId,
        role: dto.role,
        content: dto.content,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 10, // ограничение, чтобы не убить фронт
    });
  }

  async clear(userId: string) {
    const result = await this.prisma.chatMessage.deleteMany({
      where: { userId },
    });
    return { count: result.count };
  }
}
