import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './services/chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      chatMessage: {
        create: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should create chat message with userId, role, and content', async () => {
      const dto = { role: 'USER' as const, content: 'Hello!' };
      const created = { id: 1, userId: 'user-uuid-1', ...dto, createdAt: new Date() };
      mockPrisma.chatMessage.create.mockResolvedValue(created);

      const result = await service.create('user-uuid-1', dto);

      expect(mockPrisma.chatMessage.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-uuid-1',
          role: 'USER',
          content: 'Hello!',
        },
      });
      expect(result).toEqual(created);
    });
  });

  describe('findAll()', () => {
    it('should return messages ordered by createdAt asc and limited to 10', async () => {
      const messages = [
        {
          id: 1,
          userId: 'user-uuid-1',
          role: 'user',
          content: 'a',
          createdAt: new Date('2020-01-01'),
        },
        {
          id: 2,
          userId: 'user-uuid-1',
          role: 'assistant',
          content: 'b',
          createdAt: new Date('2020-01-02'),
        },
      ];
      mockPrisma.chatMessage.findMany.mockResolvedValue(messages);

      const result = await service.findAll('user-uuid-1');

      expect(mockPrisma.chatMessage.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });
      expect(result).toEqual(messages);
    });

    it('should return empty array when no messages exist', async () => {
      mockPrisma.chatMessage.findMany.mockResolvedValue([]);

      const result = await service.findAll('user-uuid-1');

      expect(result).toEqual([]);
    });
  });

  describe('clear()', () => {
    it('should delete all messages for user and return count', async () => {
      mockPrisma.chatMessage.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.clear('user-uuid-1');

      expect(mockPrisma.chatMessage.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
      });
      expect(result).toEqual({ count: 3 });
    });

    it('should return count 0 when no messages to delete', async () => {
      mockPrisma.chatMessage.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.clear('user-uuid-1');

      expect(result).toEqual({ count: 0 });
    });
  });
});
