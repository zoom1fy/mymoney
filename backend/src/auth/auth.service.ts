import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from '../user/dto/auth.dto';
import { UserService } from '..//user/user.service';
import { verify } from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private userSerivce: UserService
  ) {}

  async login(dto: AuthDto) {
    const { passwordHash, ...user } = await this.validateUser(dto);

    const token = this.issueToken(user.id);

    return {
      user,
      ...token,
    };
  }

  async register(dto: AuthDto) {
    const userOld = await this.userSerivce.getByEmail(dto.email);

    if (userOld) throw new NotFoundException('User already exists');

    const { passwordHash, ...user } = await this.userSerivce.create(dto);

    const tokens = this.issueToken(user.id);

    return {
      user,
      ...tokens,
    };
  }

  private issueToken(userId: string) {
    const data = { id: userId };

    const accessToken = this.jwt.sign(data, {
      expiresIn: '1h',
    });

    const refreshToken = this.jwt.sign(data, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async validateUser(dto: AuthDto) {
    const user = await this.userSerivce.getByEmail(dto.email);

    if (!user) throw new NotFoundException('User not found');

    const isValid = await verify(user.passwordHash, dto.password);

    if (!isValid) throw new NotFoundException('Invalid password');

    return user;
  }
}
