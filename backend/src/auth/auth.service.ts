import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from '../user/dto/auth.dto';
import { UserService } from '../user/user.service';
import { verify } from 'argon2';
import { Response } from 'express';
import { TOKEN_CONFIG, TokenConfig } from '../config/token.config';

@Injectable()
export class AuthService {
  EXPIRE_DAY_REFRESH_TOKEN = 1;

  constructor(
    private jwt: JwtService,
    private userService: UserService,
    @Inject(TOKEN_CONFIG) public readonly tokenConfig: TokenConfig
  ) {}

  async login(dto: AuthDto) {
    const { passwordHash, ...user } = await this.validateUser(dto);
    const tokens = this.issueToken(user.id);
    return { user, ...tokens };
  }

  async register(dto: AuthDto) {
    const userOld = await this.userService.getByEmail(dto.email);
    if (userOld) throw new NotFoundException('User already exists');

    const { passwordHash, ...user } = await this.userService.create(dto);
    const tokens = this.issueToken(user.id);
    return { user, ...tokens };
  }

  async getNewTokens(refreshToken: string) {
    const result = await this.jwt.verifyAsync(refreshToken);
    if (!result) throw new UnauthorizedException('Invalid refresh token');

    const userEntity = await this.userService.findById(result.id);
    if (!userEntity) throw new NotFoundException('User not found');
    const { passwordHash, ...user } = userEntity;

    const tokens = this.issueToken(user.id);
    return { user, ...tokens };
  }

  private issueToken(userId: string) {
    const data = { id: userId };
    const accessToken = this.jwt.sign(data, {
      expiresIn: this.tokenConfig.accessTokenExpiresIn,
    });
    const refreshToken = this.jwt.sign(data, {
      expiresIn: this.tokenConfig.refreshTokenExpiresIn,
    });
    return { accessToken, refreshToken };
  }

  private async validateUser(dto: AuthDto) {
    const user = await this.userService.getByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');

    const isValid = await verify(user.passwordHash, dto.password);
    if (!isValid) throw new NotFoundException('Invalid password');
    return user;
  }

  addRefreshTokenToResponse(res: Response, refreshToken: string) {
    const expiresIn = new Date();
    expiresIn.setDate(expiresIn.getDate() + this.EXPIRE_DAY_REFRESH_TOKEN);

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
