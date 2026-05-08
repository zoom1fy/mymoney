import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module, Provider } from '@nestjs/common';

export const TOKEN_CONFIG = 'TOKEN_CONFIG';

export interface TokenConfig {
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
  refreshTokenName: string;
  refreshTokenCookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'none' | 'strict';
    path: string;
  };
}

// Фабрика для создания конфигурации токенов
export const tokenConfigProvider: Provider = {
  provide: TOKEN_CONFIG,
  useFactory: (config: ConfigService): TokenConfig => {
    // Для Nest >= v2.2 можно заменить на config.getOrThrow<string>('…')
    const accessTokenExpiresIn = config.get<string>('JWT_ACCESS_EXPIRES_IN');
    const refreshTokenExpiresIn = config.get<string>('JWT_REFRESH_EXPIRES_IN');
    const refreshTokenName = config.get<string>('REFRESH_TOKEN_COOKIE_NAME');
    const nodeEnv = config.get<string>('NODE_ENV');

    if (!accessTokenExpiresIn) {
      throw new Error('JWT_ACCESS_EXPIRES_IN is not defined in environment');
    }
    if (!refreshTokenExpiresIn) {
      throw new Error('JWT_REFRESH_EXPIRES_IN is not defined in environment');
    }
    if (!refreshTokenName) {
      throw new Error('REFRESH_TOKEN_COOKIE_NAME is not defined in environment');
    }

    const isProduction = process.env.NODE_ENV === 'production';
    return {
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
      refreshTokenName,
      refreshTokenCookieOptions: {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
      },
    };
  },
  inject: [ConfigService],
};

// Модуль для импорта/экспорта TOKEN_CONFIG
@Module({
  imports: [ConfigModule],
  providers: [tokenConfigProvider],
  exports: [tokenConfigProvider],
})
export class TokenConfigModule {}
