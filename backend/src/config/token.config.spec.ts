import { ConfigService } from '@nestjs/config';
import { tokenConfigProvider, TOKEN_CONFIG, TokenConfig } from './token.config';

describe('TokenConfig', () => {
  describe('tokenConfigProvider', () => {
    it('should return TokenConfig with production cookie options', () => {
      process.env.NODE_ENV = 'production';
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
          if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
          return undefined;
        }),
      };

      const provider = tokenConfigProvider as any;
      const config = provider.useFactory(mockConfigService as unknown as ConfigService) as TokenConfig;

      expect(config.accessTokenExpiresIn).toBe('15m');
      expect(config.refreshTokenExpiresIn).toBe('7d');
      expect(config.refreshTokenName).toBe('refresh_token');
      expect(config.refreshTokenCookieOptions.secure).toBe(true);
      expect(config.refreshTokenCookieOptions.httpOnly).toBe(true);
      expect(config.refreshTokenCookieOptions.sameSite).toBe('lax');
      expect(config.refreshTokenCookieOptions.path).toBe('/');
    });

    it('should return TokenConfig with non-secure cookie in dev', () => {
      process.env.NODE_ENV = 'development';
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
          if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
          return undefined;
        }),
      };

      const provider = tokenConfigProvider as any;
      const config = provider.useFactory(mockConfigService as unknown as ConfigService) as TokenConfig;

      expect(config.refreshTokenCookieOptions.secure).toBe(false);
    });

    it('should throw if JWT_ACCESS_EXPIRES_IN is missing', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
          return undefined;
        }),
      };

      const provider = tokenConfigProvider as any;
      expect(() => provider.useFactory(mockConfigService as unknown as ConfigService)).toThrow(
        'JWT_ACCESS_EXPIRES_IN is not defined in environment'
      );
    });

    it('should throw if JWT_REFRESH_EXPIRES_IN is missing', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
          return undefined;
        }),
      };

      const provider = tokenConfigProvider as any;
      expect(() => provider.useFactory(mockConfigService as unknown as ConfigService)).toThrow(
        'JWT_REFRESH_EXPIRES_IN is not defined in environment'
      );
    });
  });
});
