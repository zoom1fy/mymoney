// chat.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { OllamaService } from './services/ollama.service';
import { MessageRole, ChatMessage } from '@prisma/client';
import { SendMessageDto } from './dto/chat.dto';
import {
  CompleteResponse,
  ErrorResponse,
  MessageResponse,
  PartialResponse,
} from './interfaces/chat-response.interface';
import { JwtService } from '@nestjs/jwt'; // импортируем JwtService

function getSocketOrigins(): string[] {
  const env = process.env.CORS_ORIGINS;
  return env ? env.split(',').map((o) => o.trim()) : ['http://localhost:3001'];
}

@WebSocketGateway({
  cors: {
    origin: getSocketOrigins(),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private chatService: ChatService,
    private ollamaService: OllamaService,
    private jwt: JwtService // внедряем
  ) {}

  @SubscribeMessage('chat:send')
  async handleMessage(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    const startTime = Date.now();

    // ---------- ручная проверка токена ----------
    const token =
      client.handshake?.auth?.token ||
      client.handshake?.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      const errResp: ErrorResponse = {
        error: 'No token provided',
        tempId: dto.tempId,
      };
      client.emit('chat:error', errResp);
      return;
    }

    let user: any;
    try {
      user = this.jwt.verify(token);
    } catch {
      const errResp: ErrorResponse = {
        error: 'Invalid or expired token',
        tempId: dto.tempId,
      };
      client.emit('chat:error', errResp);
      return;
    }
    // -------------------------------------------

    try {
      this.logger.log(
        `User ${user.id}: "${dto.text.substring(0, 50)}${dto.text.length > 50 ? '...' : ''}"`
      );

      // 1. Сохраняем сообщение пользователя
      const userMessage: ChatMessage = await this.chatService.create(user.id, {
        role: MessageRole.USER,
        content: dto.text,
      });

      // 2. Подтверждение
      const messageResponse: MessageResponse = {
        id: userMessage.id,
        content: userMessage.content,
        role: userMessage.role,
        createdAt: userMessage.createdAt,
        tempId: dto.tempId,
      };
      client.emit('chat:message', messageResponse);

      // 3. Стриминг ответа
      const assistantId = `assistant-${Date.now()}`;
      let fullResponse = '';

      for await (const chunk of this.ollamaService.generateStreamResponse(dto.text, user.id)) {
        fullResponse += chunk;
        const partialResponse: PartialResponse = {
          id: assistantId,
          chunk: chunk,
        };
        client.emit('chat:partial', partialResponse);
      }

      // 4. Сохраняем ответ ассистента
      const botMessage: ChatMessage = await this.chatService.create(user.id, {
        role: MessageRole.ASSISTANT,
        content: fullResponse,
      });

      // 5. Завершение
      const completeResponse: CompleteResponse = {
        id: assistantId,
        finalId: botMessage.id,
        response: fullResponse,
      };
      client.emit('chat:complete', completeResponse);

      this.logger.log(`User ${user.id}: completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      this.logger.error(`User error: ${error}`);
      const errorResponse: ErrorResponse = {
        error: 'Произошла ошибка при обработке сообщения',
        tempId: dto.tempId,
      };
      client.emit('chat:error', errorResponse);
    }
  }
}
