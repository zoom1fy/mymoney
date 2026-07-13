import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { UserService } from '../user/user.service';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService
  ) {
    // Ensure JWT_SECRET is set at startup to fail fast rather than at first request
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // passport-jwt types are incompatible with strict TypeScript; eslint suppressions are required
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() as (req: Request) => string | null,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // Passport calls validate after verifying the JWT; attach the full user to the request
  async validate(payload: { id: string }) {
    return this.userService.findById(payload.id);
  }
}
