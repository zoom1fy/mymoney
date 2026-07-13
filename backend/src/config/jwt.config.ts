import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const getJwtConfig = (configService: ConfigService): Promise<JwtModuleOptions> => {
  const secret = configService.get<string>('JWT_SECRET');

  if (!secret) {
    return Promise.reject(new Error('JWT_SECRET is not defined in environment variables'));
  }

  return Promise.resolve({
    secret,
    signOptions: {
      expiresIn: '1d', // Fallback; overridden per-token in auth service via token.config
    },
  });
};
