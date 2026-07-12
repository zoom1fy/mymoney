import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { SeedService } from '../seed/seed.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import { TOKEN_CONFIG, TokenConfig } from '../config/token.config';

jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn(),
}));
import { verify } from 'argon2';

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';
const TEST_USER_ID = 'user-uuid-1';

const mockTokenConfig: TokenConfig = {
  accessTokenExpiresIn: '15m',
  refreshTokenExpiresIn: '7d',
  refreshTokenName: 'refresh_token',
  refreshTokenCookieOptions: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  } as const,
};

const mockResponse = {
  cookie: jest.fn(),
} as unknown as Response;

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userService: Partial<UserService>;
  let prismaService: any;
  let tokenConfig: TokenConfig;

  const dto: AuthDto = { email: TEST_EMAIL, password: TEST_PASSWORD };

  const mockUser = {
    id: TEST_USER_ID,
    email: TEST_EMAIL,
    passwordHash: 'hash',
    createdAt: new Date(),
    lastLogin: new Date(),
  };

  beforeEach(async () => {
    const mockJwtService = {
      sign: jest.fn(),
      verifyAsync: jest.fn(),
    } as unknown as JwtService;

    const mockUserService: Partial<UserService> = {
      getByEmail: jest.fn(),
      create: jest.fn(),
      createFromHash: jest.fn(),
      findById: jest.fn(),
    };

    const mockSeedService = {
      seedNewUser: jest.fn().mockResolvedValue(undefined),
    };

    const mockMailService = {
      sendVerificationCode: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetCode: jest.fn().mockResolvedValue(undefined),
    };

    prismaService = {
      user: {
        update: jest.fn(),
      },
      pendingUser: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      passwordResetToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UserService, useValue: mockUserService },
        { provide: SeedService, useValue: mockSeedService },
        { provide: MailService, useValue: mockMailService },
        { provide: PrismaService, useValue: prismaService },
        { provide: TOKEN_CONFIG, useValue: mockTokenConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);
    tokenConfig = mockTokenConfig;

    (jwtService.sign as jest.Mock).mockImplementation((payload: any, options: any) => {
      if (options?.expiresIn === tokenConfig.accessTokenExpiresIn) {
        return 'ACCESS_TOKEN';
      }
      if (options?.expiresIn === tokenConfig.refreshTokenExpiresIn) {
        return 'REFRESH_TOKEN';
      }
      return 'TOKEN';
    });

    (jwtService.verifyAsync as jest.Mock).mockImplementation(async () => null);
    (verify as jest.Mock).mockResolvedValue(true);
  });

  describe('login()', () => {
    it('should return user and tokens when credentials are valid', async () => {
      (userService.getByEmail as jest.Mock).mockResolvedValueOnce(mockUser);
      prismaService.user.update.mockResolvedValueOnce(mockUser);

      const result = await service.login(dto);

      expect(result.user).toEqual({ id: TEST_USER_ID, email: TEST_EMAIL });
      expect(result.accessToken).toBe('ACCESS_TOKEN');
      expect(result.refreshToken).toBe('REFRESH_TOKEN');
    });

    it('should throw NotFoundException if user not found', async () => {
      (userService.getByEmail as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.login(dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException if password is invalid', async () => {
      (userService.getByEmail as jest.Mock).mockResolvedValueOnce(mockUser);
      (verify as jest.Mock).mockResolvedValueOnce(false);
      await expect(service.login(dto)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('register()', () => {
    it('should create pending user and return email', async () => {
      (userService.getByEmail as jest.Mock).mockResolvedValueOnce(null);
      prismaService.pendingUser.findUnique.mockResolvedValueOnce(null);
      prismaService.pendingUser.create.mockResolvedValueOnce({});

      const result = await service.register(dto);

      expect(result).toEqual({ email: TEST_EMAIL });
      expect(prismaService.pendingUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: TEST_EMAIL }),
        })
      );
    });

    it('should throw ConflictException if user already exists', async () => {
      (userService.getByEmail as jest.Mock).mockResolvedValueOnce(mockUser);
      await expect(service.register(dto)).rejects.toThrow('уже существует');
    });
  });

  describe('verifyEmail()', () => {
    it('should verify email and return tokens', async () => {
      const code = '123456';
      const pendingUser = { id: 'pending-1', email: TEST_EMAIL, passwordHash: 'hash', code, sentAt: new Date() };
      prismaService.pendingUser.findUnique.mockResolvedValueOnce(pendingUser);
      (userService.createFromHash as jest.Mock).mockResolvedValueOnce(mockUser);
      prismaService.pendingUser.delete.mockResolvedValueOnce({});

      const result = await service.verifyEmail(TEST_EMAIL, code);

      expect(result.accessToken).toBe('ACCESS_TOKEN');
      expect(result.refreshToken).toBe('REFRESH_TOKEN');
    });

    it('should throw BadRequestException if code expired', async () => {
      const code = '123456';
      const oldDate = new Date(Date.now() - 20 * 60 * 1000);
      const pendingUser = { id: 'pending-1', email: TEST_EMAIL, passwordHash: 'hash', code, sentAt: oldDate };
      prismaService.pendingUser.findUnique.mockResolvedValueOnce(pendingUser);

      await expect(service.verifyEmail(TEST_EMAIL, code)).rejects.toThrow('истёк');
    });
  });

  describe('resendCode()', () => {
    it('should generate new code and send email', async () => {
      const pendingUser = { id: 'pending-1', email: TEST_EMAIL, sentAt: new Date(Date.now() - 120 * 1000) };
      prismaService.pendingUser.findUnique.mockResolvedValueOnce(pendingUser);

      const result = await service.resendCode(TEST_EMAIL);

      expect(result).toEqual({ message: 'Новый код отправлен на почту' });
      expect(prismaService.pendingUser.update).toHaveBeenCalled();
    });
  });

  describe('forgotPassword()', () => {
    it('should create reset token and send email', async () => {
      (userService.getByEmail as jest.Mock).mockResolvedValueOnce(mockUser);
      prismaService.passwordResetToken.create.mockResolvedValueOnce({});

      const result = await service.forgotPassword(TEST_EMAIL);

      expect(result).toEqual({ message: 'Код для восстановления пароля отправлен на почту' });
    });
  });

  describe('resetPassword()', () => {
    it('should reset password with valid token', async () => {
      const code = '123456';
      const resetToken = { id: 'token-id', userId: TEST_USER_ID, code, expiresAt: new Date(Date.now() + 60000), usedAt: null };
      (userService.getByEmail as jest.Mock).mockResolvedValueOnce(mockUser);
      prismaService.passwordResetToken.findFirst.mockResolvedValueOnce(resetToken);
      prismaService.$transaction.mockResolvedValueOnce([{}, {}]);

      const result = await service.resetPassword(TEST_EMAIL, code, 'newPass1');

      expect(result).toEqual({ message: 'Пароль успешно изменён' });
    });
  });

  describe('getNewTokens()', () => {
    it('should return new tokens when refresh token is valid', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValueOnce({ id: TEST_USER_ID } as any);
      (userService.findById as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await (service as any).getNewTokens('VALID_REFRESH_TOKEN');

      expect(result.user).toMatchObject({ id: TEST_USER_ID, email: TEST_EMAIL });
      expect(result.accessToken).toBe('ACCESS_TOKEN');
      expect(result.refreshToken).toBe('REFRESH_TOKEN');
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.getNewTokens('BAD_TOKEN')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw NotFoundException if user not found after token verification', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValueOnce({ id: TEST_USER_ID } as any);
      (userService.findById as jest.Mock).mockResolvedValueOnce(undefined);
      await expect(service.getNewTokens('TOKEN')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('addRefreshTokenToResponse()', () => {
    const ORIGINAL_DATE = Date;
    const MOCK_DATE = new Date('2026-05-01T12:00:00Z');
    beforeEach(() => {
      (global as any).Date = class extends ORIGINAL_DATE {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(MOCK_DATE.getTime());
          } else {
            super(...(args as [string | number | Date]));
          }
        }
        static now() {
          return MOCK_DATE.getTime();
        }
      } as any;
    });
    afterEach(() => {
      global.Date = ORIGINAL_DATE;
    });

    it('should set cookie with correct name, value, and options', () => {
      service.addRefreshTokenToResponse(mockResponse, 'REFRESH_TOKEN');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        tokenConfig.refreshTokenName,
        'REFRESH_TOKEN',
        expect.objectContaining({ expires: expect.any(Date) })
      );
    });
  });

  describe('removeRefreshTokenFromResponse()', () => {
    it('should clear the refresh token cookie', () => {
      service.removeRefreshTokenFromResponse(mockResponse);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        tokenConfig.refreshTokenName,
        '',
        expect.objectContaining({ expires: new Date(0) })
      );
    });
  });
});
