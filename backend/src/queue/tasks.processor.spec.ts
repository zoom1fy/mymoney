import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { TasksJobData, TasksProcessor } from './tasks.processor';
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

  // `process` reads only `name` and `data`, so the mocks stay partial instead of
  // carrying the rest of BullMQ's Job surface. Confining the cast here keeps `any`
  // out of the call sites and gives the payload the union the processor expects.
  const buildJob = (name: string, data: TasksJobData): Job<TasksJobData> =>
    ({ name, data }) as Job<TasksJobData>;

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('calls sendVerificationCode for send-verification-email job', async () => {
      const job = buildJob('send-verification-email', { email: 'a@b.com', code: '123' });
      await processor.process(job);
      expect(mailService.sendVerificationCode).toHaveBeenCalledWith('a@b.com', '123');
    });

    it('calls sendPasswordResetCode for send-password-reset-email job', async () => {
      const job = buildJob('send-password-reset-email', { email: 'a@b.com', code: '456' });
      await processor.process(job);
      expect(mailService.sendPasswordResetCode).toHaveBeenCalledWith('a@b.com', '456');
    });

    it('calls seedNewUser for seed-new-user job', async () => {
      const job = buildJob('seed-new-user', { userId: 'user-uuid' });
      await processor.process(job);
      expect(seedService.seedNewUser).toHaveBeenCalledWith('user-uuid');
    });

    it('logs a warning for unknown job name', async () => {
      // The default branch reads only `name`, so the payload carries nothing.
      const job = buildJob('unknown-job', {} as TasksJobData);
      const warnSpy = jest.spyOn(processor['logger'], 'warn');
      await processor.process(job);
      expect(warnSpy).toHaveBeenCalledWith('Unknown job name: unknown-job');
    });
  });
});
