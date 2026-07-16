import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TasksService {
  constructor(@InjectQueue('tasks') private readonly tasksQueue: Queue) {}

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    await this.tasksQueue.add(
      'send-verification-email',
      { email, code },
      { removeOnComplete: true, removeOnFail: false }
    );
  }

  async sendPasswordResetEmail(email: string, code: string): Promise<void> {
    await this.tasksQueue.add(
      'send-password-reset-email',
      { email, code },
      { removeOnComplete: true, removeOnFail: false }
    );
  }

  async seedNewUser(userId: string): Promise<void> {
    await this.tasksQueue.add(
      'seed-new-user',
      { userId },
      { removeOnComplete: true, removeOnFail: false }
    );
  }
}
