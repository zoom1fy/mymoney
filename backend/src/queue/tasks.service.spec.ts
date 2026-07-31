import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  let mockQueue: { add: jest.Mock };

  beforeEach(async () => {
    mockQueue = { add: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService, { provide: getQueueToken('tasks'), useValue: mockQueue }],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('adds a send-verification-email job to the queue', async () => {
      await service.sendVerificationEmail('user@test.com', 'ABC123');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-verification-email',
        { email: 'user@test.com', code: 'ABC123' },
        { removeOnComplete: true, removeOnFail: false }
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('adds a send-password-reset-email job to the queue', async () => {
      await service.sendPasswordResetEmail('user@test.com', 'XYZ789');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-password-reset-email',
        { email: 'user@test.com', code: 'XYZ789' },
        { removeOnComplete: true, removeOnFail: false }
      );
    });
  });

  describe('seedNewUser', () => {
    it('adds a seed-new-user job to the queue', async () => {
      await service.seedNewUser('user-uuid');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'seed-new-user',
        { userId: 'user-uuid' },
        { removeOnComplete: true, removeOnFail: false }
      );
    });
  });
});
