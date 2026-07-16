import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TasksService } from './tasks.service';
import { TasksProcessor } from './tasks.processor';
import { MailModule } from '../mail/mail.module';
import { SeedModule } from '../seed/seed.module';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    BullModule.registerQueue({ name: 'tasks' }),
    MailModule,
    SeedModule,
  ],
  providers: [TasksService, TasksProcessor],
  exports: [TasksService],
})
export class QueueModule {}
