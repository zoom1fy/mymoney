import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: any;

  const mockResponse = (): Response => {
    const res: any = {};
    res.cookie = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockRequest = (cookies: Record<string, string> = {}): Request => ({ cookies }) as Request;

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
      register: jest.fn(),
      verifyEmail: jest.fn(),
      resendCode: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      getNewTokens: jest.fn(),
      addRefreshTokenToResponse: jest.fn(),
      removeRefreshTokenFromResponse: jest.fn(),
      tokenConfig: { refreshTokenName: 'refresh_token' },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login()', () => {
    it('should return user and accessToken, set refresh cookie', async () => {
      const dto = { email: 'test@test.com', password: 'pass' };
      const loginResult = {
        user: { id: '1', email: 'test@test.com' },
        accessToken: 'access',
        refreshToken: 'refresh',
      };
      mockAuthService.login.mockResolvedValue(loginResult);
      const res = mockResponse();

      const result = await controller.login(dto, res);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(mockAuthService.addRefreshTokenToResponse).toHaveBeenCalledWith(res, 'refresh');
      expect(result).toEqual({ user: { id: '1', email: 'test@test.com' }, accessToken: 'access' });
    });
  });

  describe('register()', () => {
    it('should send verification code and return email', async () => {
      const dto = { email: 'new@test.com', password: 'pass' };
      const registerResult = { email: 'new@test.com' };
      mockAuthService.register.mockResolvedValue(registerResult);

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(registerResult);
    });
  });

  describe('getNewTokens()', () => {
    it('should return new tokens when refresh token exists', async () => {
      const req = mockRequest({ refresh_token: 'valid-refresh' });
      const res = mockResponse();
      const tokensResult = {
        user: { id: '1' },
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      };
      mockAuthService.getNewTokens.mockResolvedValue(tokensResult);

      const result = await controller.getNewTokens(req, res);

      expect(mockAuthService.getNewTokens).toHaveBeenCalledWith('valid-refresh');
      expect(mockAuthService.addRefreshTokenToResponse).toHaveBeenCalledWith(res, 'new-refresh');
      expect(result).toEqual({ user: { id: '1' }, accessToken: 'new-access' });
    });

    it('should throw UnauthorizedException when no refresh token', async () => {
      const req = mockRequest({});
      const res = mockResponse();

      await expect(controller.getNewTokens(req, res)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(mockAuthService.removeRefreshTokenFromResponse).toHaveBeenCalledWith(res);
    });
  });

  describe('logout()', () => {
    it('should clear refresh cookie and return true', () => {
      const res = mockResponse();

      const result = controller.logout(res);

      expect(mockAuthService.removeRefreshTokenFromResponse).toHaveBeenCalledWith(res);
      expect(result).toBe(true);
    });
  });

  describe('verifyEmail()', () => {
    it('should verify email and return tokens', async () => {
      const dto = { email: 'test@test.com', code: '123456' };
      const verifyResult = {
        user: { id: '1', email: 'test@test.com' },
        accessToken: 'access',
        refreshToken: 'refresh',
      };
      mockAuthService.verifyEmail.mockResolvedValue(verifyResult);
      const res = mockResponse();

      const result = await controller.verifyEmail(dto, res);

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(dto.email, dto.code);
      expect(mockAuthService.addRefreshTokenToResponse).toHaveBeenCalledWith(res, 'refresh');
      expect(result).toEqual({ user: { id: '1', email: 'test@test.com' }, accessToken: 'access' });
    });
  });

  describe('resendCode()', () => {
    it('should resend verification code', async () => {
      const dto = { email: 'test@test.com' };
      mockAuthService.resendCode.mockResolvedValue({ message: 'Новый код отправлен на почту' });

      await controller.resendCode(dto);

      expect(mockAuthService.resendCode).toHaveBeenCalledWith(dto.email);
    });
  });

  describe('forgotPassword()', () => {
    it('should send password reset code', async () => {
      const dto = { email: 'test@test.com' };
      mockAuthService.forgotPassword.mockResolvedValue({
        message: 'Код для восстановления пароля отправлен на почту',
      });

      await controller.forgotPassword(dto);

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto.email);
    });
  });

  describe('resetPassword()', () => {
    it('should reset password with valid code', async () => {
      const dto = { email: 'test@test.com', code: '123456', password: 'newPass1' };
      mockAuthService.resetPassword.mockResolvedValue({ message: 'Пароль успешно изменён' });

      await controller.resetPassword(dto);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(dto.email, dto.code, dto.password);
    });
  });
});
