import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // другие модули...
  ],
  controllers: [AppController],    // <-- добавлено
  providers: [AppService, PrismaService],  // <-- добавлено
})
export class AppModule {}
