import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();

    // токен может быть передан в разных местах
    const token =
      client.handshake?.auth?.token ||
      client.handshake?.headers?.authorization?.replace('Bearer ', '');

    if (!token) throw new UnauthorizedException('No token');

    try {
      const payload = this.jwt.verify(token);
      client.user = payload; // прокидываем в socket.user
      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
