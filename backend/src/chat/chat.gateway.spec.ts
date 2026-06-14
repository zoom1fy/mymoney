import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './services/chat.service';
import { OllamaService } from './services/ollama.service';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let mockChatService: any;
  let mockOllamaService: any;
  let mockJwtService: any;

  const createMockSocket = (overrides: any = {}): Socket => {
    const client: any = {
      handshake: {
        auth: {},
        headers: {},
      },
      emit: jest.fn(),
      ...overrides,
    };
    return client as Socket;
  };

  beforeEach(async () => {
    mockChatService = {
      create: jest.fn(),
    };

    mockOllamaService = {
      generateStreamResponse: jest.fn(),
    };

    mockJwtService = {
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: ChatService, useValue: mockChatService },
        { provide: OllamaService, useValue: mockOllamaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    gateway.server = { emit: jest.fn() } as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleMessage()', () => {
    const dto = { text: 'Hello', tempId: 'temp-1' };
    const userPayload = { id: 'user-uuid-1' };

    it('should emit chat:error if no token provided', async () => {
      const client = createMockSocket();

      await gateway.handleMessage(dto, client);

      expect(client.emit).toHaveBeenCalledWith('chat:error', {
        error: 'No token provided',
        tempId: 'temp-1',
      });
    });

    it('should emit chat:error if token is invalid', async () => {
      const client = createMockSocket({
        handshake: { auth: { token: 'bad-token' }, headers: {} },
      });
      mockJwtService.verify.mockImplementation(() => { throw new Error(); });

      await gateway.handleMessage(dto, client);

      expect(client.emit).toHaveBeenCalledWith('chat:error', {
        error: 'Invalid or expired token',
        tempId: 'temp-1',
      });
    });

    it('should process message successfully with token in auth', async () => {
      const client = createMockSocket({
        handshake: { auth: { token: 'valid-token' }, headers: {} },
      });
      mockJwtService.verify.mockReturnValue(userPayload);
      mockChatService.create
        .mockResolvedValueOnce({ id: 1, content: 'Hello', role: 'USER', createdAt: new Date() })
        .mockResolvedValueOnce({ id: 2, content: 'Response', role: 'ASSISTANT', createdAt: new Date() });
      mockOllamaService.generateStreamResponse.mockReturnValue(
        (async function* () { yield 'Re'; yield 'sponse'; })()
      );

      await gateway.handleMessage(dto, client);

      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(mockChatService.create).toHaveBeenCalledTimes(2);
      expect(client.emit).toHaveBeenCalledWith('chat:message', expect.objectContaining({ tempId: 'temp-1' }));
      expect(client.emit).toHaveBeenCalledWith('chat:partial', expect.objectContaining({ chunk: 'Re' }));
      expect(client.emit).toHaveBeenCalledWith('chat:partial', expect.objectContaining({ chunk: 'sponse' }));
      expect(client.emit).toHaveBeenCalledWith('chat:complete', expect.objectContaining({ response: 'Response' }));
    });

    it('should extract token from Authorization header', async () => {
      const client = createMockSocket({
        handshake: {
          auth: {},
          headers: { authorization: 'Bearer header-token' },
        },
      });
      mockJwtService.verify.mockReturnValue(userPayload);
      mockChatService.create
        .mockResolvedValueOnce({ id: 1, content: 'Hi', role: 'USER', createdAt: new Date() })
        .mockResolvedValueOnce({ id: 2, content: 'Resp', role: 'ASSISTANT', createdAt: new Date() });
      mockOllamaService.generateStreamResponse.mockReturnValue(
        (async function* () { yield 'Resp'; })()
      );

      await gateway.handleMessage(dto, client);

      expect(mockJwtService.verify).toHaveBeenCalledWith('header-token');
    });

    it('should emit chat:error on service exception', async () => {
      const client = createMockSocket({
        handshake: { auth: { token: 'valid-token' }, headers: {} },
      });
      mockJwtService.verify.mockReturnValue(userPayload);
      mockChatService.create.mockRejectedValue(new Error('DB error'));

      await gateway.handleMessage(dto, client);

      expect(client.emit).toHaveBeenCalledWith('chat:error', {
        error: 'Произошла ошибка при обработке сообщения',
        tempId: 'temp-1',
      });
    });
  });
});
