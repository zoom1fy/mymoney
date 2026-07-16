import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from '../mail/mail.service';
import { SeedService } from '../seed/seed.service';

interface SendEmailJobData {
  email: string;
  code: string;
}

interface SeedUserJobData {
  userId: string;
}

type TasksJobData = SendEmailJobData | SeedUserJobData;

@Processor('tasks')
export class TasksProcessor extends WorkerHost {
  private readonly logger = new Logger(TasksProcessor.name);

  constructor(
    private readonly mailService: MailService,
    private readonly seedService: SeedService
  ) {
    super();
  }

  async process(job: Job<TasksJobData>): Promise<void> {
    switch (job.name) {
      case 'send-verification-email': {
        const { email, code } = job.data as SendEmailJobData;
        await this.mailService.sendVerificationCode(email, code);
        break;
      }
      case 'send-password-reset-email': {
        const { email, code } = job.data as SendEmailJobData;
        await this.mailService.sendPasswordResetCode(email, code);
        break;
      }
      case 'seed-new-user': {
        const { userId } = job.data as SeedUserJobData;
        await this.seedService.seedNewUser(userId);
        break;
      }
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
