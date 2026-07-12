import { ConfigService } from '@nestjs/config';

jest.mock('passport-jwt', () => ({
  ExtractJwt: { fromAuthHeaderAsBearerToken: () => jest.fn() },
  Strategy: class MockStrategy {
    constructor(_opts: unknown, _verify?: unknown) {
      void _opts;
      void _verify;
    }
  },
}));

jest.mock('@nestjs/passport', () => ({
  PassportStrategy: (Strategy: any) => {
    return class extends Strategy {};
  },
}));

describe('JwtStrategy', () => {
  let strategy: any;
  let mockUserService: any;

  beforeEach(async () => {
    jest.resetModules();

    mockUserService = {
      findById: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        return undefined;
      }),
    };

    const { JwtStrategy } = await import('./jwt.strategy');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    strategy = new JwtStrategy(mockConfigService as unknown as ConfigService, mockUserService);
  });

  describe('validate()', () => {
    it('should return user from userService.findById', async () => {
      const payload = { id: 'user-uuid-1' };
      const expectedUser = { id: 'user-uuid-1', email: 'test@test.com' };
      mockUserService.findById.mockResolvedValue(expectedUser);

      const result = await strategy.validate(payload);

      expect(mockUserService.findById).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toEqual(expectedUser);
    });
  });
});
