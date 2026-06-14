import { ConfigService } from '@nestjs/config';
import { getJwtConfig } from './jwt.config';

describe('getJwtConfig', () => {
  it('should return JwtModuleOptions with secret and default expiresIn', async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        return undefined;
      }),
    };

    const config = await getJwtConfig(mockConfigService as unknown as ConfigService);

    expect(config.secret).toBe('test-secret');
    expect(config.signOptions?.expiresIn).toBe('1d');
  });

  it('should throw if JWT_SECRET is not defined', async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    await expect(getJwtConfig(mockConfigService as unknown as ConfigService)).rejects.toThrow(
      'JWT_SECRET is not defined in environment variables'
    );
  });
});
