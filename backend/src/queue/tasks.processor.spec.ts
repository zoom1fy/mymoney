import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { TasksProcessor } from './tasks.processor';
import { MailService } from '../mail/mail.service';
import { SeedService } from '../seed/seed.service';

describe('TasksProcessor', () => {
  let processor: TasksProcessor;
  let mailService: Partial<MailService>;
  let seedService: Partial<SeedService>;

  beforeEach(async () => {
    mailService = {
      sendVerificationCode: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetCode: jest.fn().mockResolvedValue(undefined),
    };
    seedService = {
      seedNewUser: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksProcessor,
        { provide: MailService, useValue: mailService },
        { provide: SeedService, useValue: seedService },
      ],
    }).compile();

    processor = module.get<TasksProcessor>(TasksProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('calls sendVerificationCode for send-verification-email job', async () => {
      const job = { name: 'send-verification-email', data: { email: 'a@b.com', code: '123' } } as Job;
      await processor.process(job);
      expect(mailService.sendVerificationCode).toHaveBeenCalledWith('a@b.com', '123');
    });

    it('calls sendPasswordResetCode for send-password-reset-email job', async () => {
      const job = { name: 'send-password-reset-email', data: { email: 'a@b.com', code: '456' } } as Job;
      await processor.process(job);
      expect(mailService.sendPasswordResetCode).toHaveBeenCalledWith('a@b.com', '456');
    });

    it('calls seedNewUser for seed-new-user job', async () => {
      const job = { name: 'seed-new-user', data: { userId: 'user-uuid' } } as Job;
      await processor.process(job);
      expect(seedService.seedNewUser).toHaveBeenCalledWith('user-uuid');
    });

    it('logs a warning for unknown job name', async () => {
      const job = { name: 'unknown-job', data: {} } as Job;
      const warnSpy = jest.spyOn(processor['logger'], 'warn');
      await processor.process(job);
      expect(warnSpy).toHaveBeenCalledWith('Unknown job name: unknown-job');
    });
  });
});
