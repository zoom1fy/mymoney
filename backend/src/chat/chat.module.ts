// backend/src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { OllamaService } from './services/ollama.service';
import { FinancialDataService } from './services/financial-data.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { AnalysisModule } from './services/analysis/analysis.module';

@Module({
  imports: [AuthModule, AnalysisModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, OllamaService, FinancialDataService, PrismaService],
  exports: [ChatService, OllamaService],
})
export class ChatModule {}
