import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { AuthDto } from './dto/auth.dto';
import { TOKEN_CONFIG, TokenConfig } from '../config/token.config';

// Mock argon2 verify/hash (verify used by AuthService)
jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn(),
}));
import { verify } from 'argon2';

// Realistic test constants
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';
const TEST_USER_ID = 'user-uuid-1';

// Token config mock as requested
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

// Minimal mock for Response cookie usage
const mockResponse = {
  cookie: jest.fn(),
} as unknown as Response;

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userService: Partial<UserService>;
  let tokenConfig: TokenConfig;

  // Common dto used in tests
  const dto: AuthDto = { email: TEST_EMAIL, password: TEST_PASSWORD };

  beforeEach(async () => {
    // Create mocks for dependencies
    const mockJwtService = {
      sign: jest.fn(),
      verifyAsync: jest.fn(),
    } as unknown as JwtService;

    // Jest mocks for UserService methods
    const mockUserService: Partial<UserService> = {
      getByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };

    // Build testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UserService, useValue: mockUserService },
        { provide: TOKEN_CONFIG, useValue: mockTokenConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);
    tokenConfig = mockTokenConfig;

    // Default mock implementations
    (jwtService.sign as jest.Mock).mockImplementation((payload: any, options: any) => {
      // Distinguish access vs refresh tokens
      if (options?.expiresIn === tokenConfig.accessTokenExpiresIn) {
        return 'ACCESS_TOKEN';
      }
      if (options?.expiresIn === tokenConfig.refreshTokenExpiresIn) {
        return 'REFRESH_TOKEN';
      }
      return 'TOKEN';
    });

    (jwtService.verifyAsync as jest.Mock).mockImplementation(async (token: string) => {
      // Default: treat as valid when explicitly overridden in tests
      return null;
    });

    // Default argon2 verify to true for successful authentication tests
    (verify as jest.Mock).mockResolvedValue(true);
  });

  // 1) login()
  describe('login()', () => {
    it('should return user and tokens when credentials are valid', async () => {
      const user = { id: TEST_USER_ID, email: TEST_EMAIL, passwordHash: 'hash' } as any;
      (userService.getByEmail as jest.Mock).mockResolvedValueOnce(user);

      const result = await service.login(dto);

      // User should be without passwordHash
      expect(result.user).toEqual({ id: TEST_USER_ID, email: TEST_EMAIL });
      expect(result.accessToken).toBe('ACCESS_TOKEN');
      expect(result.refreshToken).toBe('REFRESH_TOKEN');
      // verify that tokens were issued with correct userId
      expect(jwtService.sign as jest.Mock).toHaveBeenCalledWith(
        { id: TEST_USER_ID },
        expect.objectContaining({ expiresIn: tokenConfig.accessTokenExpiresIn })
      );
      expect(jwtService.sign as jest.Mock).toHaveBeenCalledWith(
        { id: TEST_USER_ID },
        expect.objectContaining({ expiresIn: tokenConfig.refreshTokenExpiresIn })
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      (userService.getByEmail as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.login(dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException if password is invalid', async () => {
      const user = { id: TEST_USER_ID, email: TEST_EMAIL, passwordHash: 'hash' } as any;
      (userService.getByEmail as jest.Mock).mockResolvedValueOnce(user);
      (verify as jest.Mock).mockResolvedValueOnce(false);
      await expect(service.login(dto)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // 2) register()
  describe('register()', () => {
    it('should create new user and return tokens', async () => {
      const newUser = { id: TEST_USER_ID, email: TEST_EMAIL, passwordHash: 'hash' } as any;
      (userService.getByEmail as jest.Mock).mockResolvedValueOnce(null);
      (userService.create as jest.Mock).mockResolvedValueOnce(newUser);

      const result = await service.register(dto);

      expect(result.user).toEqual({ id: TEST_USER_ID, email: TEST_EMAIL });
      expect(result.accessToken).toBe('ACCESS_TOKEN');
      expect(result.refreshToken).toBe('REFRESH_TOKEN');
      expect(userService.create).toHaveBeenCalledWith(dto);
    });

    it('should throw NotFoundException if user with email already exists', async () => {
      (userService.getByEmail as jest.Mock).mockResolvedValueOnce({ id: 'ex' } as any);
      await expect(service.register(dto)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // 3) getNewTokens()
  describe('getNewTokens()', () => {
    it('should return new tokens when refresh token is valid', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValueOnce({ id: TEST_USER_ID } as any);
      const userFromDb = { id: TEST_USER_ID, email: TEST_EMAIL, passwordHash: 'hash' } as any;
      (userService.findById as jest.Mock).mockResolvedValueOnce(userFromDb);

      const result = await (service as any).getNewTokens('VALID_REFRESH_TOKEN');

      expect(result.user).toEqual({ id: TEST_USER_ID, email: TEST_EMAIL });
      expect(result.accessToken).toBe('ACCESS_TOKEN');
      expect(result.refreshToken).toBe('REFRESH_TOKEN');

      // ensure sign called with correct user id again
      expect(jwtService.sign as jest.Mock).toHaveBeenCalledWith(
        { id: TEST_USER_ID },
        expect.objectContaining({ expiresIn: tokenConfig.accessTokenExpiresIn })
      );
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

  // 4) addRefreshTokenToResponse()
  describe('addRefreshTokenToResponse()', () => {
    // Simple deterministic date handling by mocking Date
    const ORIGINAL_DATE = Date;
    const MOCK_DATE = new Date('2026-05-01T12:00:00Z');
    beforeEach(() => {
      // @ts-ignore
      global.Date = class extends ORIGINAL_DATE {
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
        expect.objectContaining({
          expires: expect.any(Date),
        })
      );
      // verify expires date equals MOCK_DATE + 1 day
      const expiresDate = (mockResponse.cookie as any).mock.calls[0][2].expires as Date;
      const expectedExpires = new Date(MOCK_DATE);
      expectedExpires.setDate(expectedExpires.getDate() + 1);
      expect(expiresDate.getTime()).toBe(expectedExpires.getTime());
    });
  });

  // 5) removeRefreshTokenFromResponse()
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
