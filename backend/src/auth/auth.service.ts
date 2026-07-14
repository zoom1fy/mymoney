import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../user/user.service';
import { SeedService } from '../seed/seed.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { verify, hash } from 'argon2';
import { Response } from 'express';
import { TOKEN_CONFIG, TokenConfig } from '../config/token.config';
import { SignOptions } from 'jsonwebtoken';
import { randomInt } from 'crypto';

@Injectable()
export class AuthService {
  static readonly EXPIRE_DAY_REFRESH = 1;

  constructor(
    private jwt: JwtService,
    private userService: UserService,
    private seedService: SeedService,
    private mailService: MailService,
    private prisma: PrismaService,
    @Inject(TOKEN_CONFIG) public readonly tokenConfig: TokenConfig
  ) {}

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto);

    const tokens = this.issueToken(user.id);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return { user: { id: user.id, email: user.email }, ...tokens };
  }

  // Uses a pending user table as a two-step registration:
  // 1. User submits email+password → verification code sent
  // 2. User submits the code → account created (verifyEmail)
  // This prevents account creation with unverified emails.
  async register(dto: LoginDto) {
    const existingUser = await this.userService.getByEmail(dto.email);
    if (existingUser) throw new ConflictException('Пользователь с таким email уже существует');

    const pendingUser = await this.prisma.pendingUser.findUnique({ where: { email: dto.email } });
    if (pendingUser) {
      // Enforce 1-minute cooldown to prevent abuse of the send-code endpoint
      if (Date.now() - pendingUser.sentAt.getTime() < 60 * 1000) {
        throw new BadRequestException('Код уже отправлен. Повторите через минуту.');
      }
      const code = this.generateCode();
      await this.prisma.pendingUser.update({
        where: { id: pendingUser.id },
        data: { code, sentAt: new Date() },
      });
      await this.mailService.sendVerificationCode(dto.email, code);
      return { email: dto.email };
    }

    const passwordHash = await hash(dto.password);
    const code = this.generateCode();

    await this.prisma.pendingUser.create({
      data: { email: dto.email, passwordHash, code, sentAt: new Date() },
    });

    await this.mailService.sendVerificationCode(dto.email, code);

    return { email: dto.email };
  }

  // Completes registration: validates the code (15-min TTL), creates user, seeds starter data
  async verifyEmail(email: string, code: string) {
    const pending = await this.prisma.pendingUser.findUnique({ where: { email } });
    if (!pending) throw new BadRequestException('Код не запрашивался или истёк');

    if (Date.now() - pending.sentAt.getTime() > 15 * 60 * 1000) {
      await this.prisma.pendingUser.delete({ where: { id: pending.id } });
      throw new BadRequestException('Код истёк. Зарегистрируйтесь заново.');
    }

    if (pending.code !== code) throw new BadRequestException('Неверный код');

    const user = await this.userService.createFromHash(email, pending.passwordHash);

    // Seed default categories, accounts, and sample transactions for the new user
    await this.seedService.seedNewUser(user.id).catch((err) => {
      console.error('Failed to seed data for new user:', err);
    });

    await this.prisma.pendingUser.delete({ where: { id: pending.id } });

    const tokens = this.issueToken(user.id);

    return { user: { id: user.id, email: user.email }, ...tokens };
  }

  async resendCode(email: string) {
    const pending = await this.prisma.pendingUser.findUnique({ where: { email } });
    if (!pending) throw new NotFoundException('Регистрация не найдена. Зарегистрируйтесь заново.');

    // Same 1-minute cooldown as in register to prevent abuse
    if (Date.now() - pending.sentAt.getTime() < 60 * 1000) {
      throw new BadRequestException('Код уже отправлен. Повторите через минуту.');
    }

    const code = this.generateCode();
    await this.prisma.pendingUser.update({
      where: { id: pending.id },
      data: { code, sentAt: new Date() },
    });

    await this.mailService.sendVerificationCode(email, code);

    return { message: 'Новый код отправлен на почту' };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.getByEmail(email);
    if (!user) throw new NotFoundException('Пользователь с таким email не найден');

    const recent = await this.prisma.passwordResetToken.findFirst({
      where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 60 * 1000) } },
    });
    if (recent) throw new BadRequestException('Код уже отправлен. Повторите через минуту.');

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, code, expiresAt },
    });

    await this.mailService.sendPasswordResetCode(user.email, code);

    return { message: 'Код для восстановления пароля отправлен на почту' };
  }

  // Atomically updates the password and marks the reset token as used (prevents replay)
  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.userService.getByEmail(email);
    if (!user) throw new NotFoundException('Пользователь не найден');

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: { userId: user.id, code, usedAt: null, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetToken) throw new BadRequestException('Неверный или истёкший код');

    const passwordHash = await hash(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Пароль успешно изменён' };
  }

  // Verifies the refresh token JWT and issues a new token pair (rotation)
  async getNewTokens(refreshToken: string) {
    const result = await this.jwt.verifyAsync<{ id: string }>(refreshToken);
    if (!result) throw new UnauthorizedException('Invalid refresh token');

    const userEntity = await this.userService.findById(result.id);
    if (!userEntity) throw new NotFoundException('User not found');
    const { passwordHash, ...user } = userEntity;
    void passwordHash;

    const tokens = this.issueToken(user.id);
    return { user, ...tokens };
  }

  // Signs both an access token (short-lived) and a refresh token (long-lived) with configurable expiry
  private issueToken(userId: string) {
    const data = { id: userId };

    const signOptions: SignOptions = {
      expiresIn: this.tokenConfig.accessTokenExpiresIn as SignOptions['expiresIn'],
    };

    const refreshOptions: SignOptions = {
      expiresIn: this.tokenConfig.refreshTokenExpiresIn as SignOptions['expiresIn'],
    };

    const accessToken = this.jwt.sign(data, signOptions);
    const refreshToken = this.jwt.sign(data, refreshOptions);

    return { accessToken, refreshToken };
  }

  private async validateUser(dto: LoginDto) {
    const user = await this.userService.getByEmail(dto.email);
    if (!user) throw new NotFoundException('Пользователь не найден');

    const isValid = await verify(user.passwordHash, dto.password);
    if (!isValid) throw new NotFoundException('Неверный логин или пароль');
    return user;
  }

  private generateCode(): string {
    return randomInt(100000, 999999).toString();
  }

  // Sets the refresh token as an httpOnly cookie so the client cannot access it via JS
  addRefreshTokenToResponse(res: Response, refreshToken: string) {
    const expiresIn = new Date();
    expiresIn.setDate(expiresIn.getDate() + AuthService.EXPIRE_DAY_REFRESH);

    res.cookie(this.tokenConfig.refreshTokenName, refreshToken, {
      ...this.tokenConfig.refreshTokenCookieOptions,
      expires: expiresIn,
    });
  }

  removeRefreshTokenFromResponse(res: Response) {
    res.cookie(this.tokenConfig.refreshTokenName, '', {
      ...this.tokenConfig.refreshTokenCookieOptions,
      expires: new Date(0),
    });
  }
}
