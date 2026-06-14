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

  const mockRequest = (cookies: Record<string, string> = {}): Request =>
    ({ cookies } as Request);

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
      register: jest.fn(),
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
      const loginResult = { user: { id: '1', email: 'test@test.com' }, accessToken: 'access', refreshToken: 'refresh' };
      mockAuthService.login.mockResolvedValue(loginResult);
      const res = mockResponse();

      const result = await controller.login(dto, res);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(mockAuthService.addRefreshTokenToResponse).toHaveBeenCalledWith(res, 'refresh');
      expect(result).toEqual({ user: { id: '1', email: 'test@test.com' }, accessToken: 'access' });
    });
  });

  describe('register()', () => {
    it('should return user and accessToken, set refresh cookie', async () => {
      const dto = { email: 'new@test.com', password: 'pass' };
      const registerResult = { user: { id: '2', email: 'new@test.com' }, accessToken: 'access', refreshToken: 'refresh' };
      mockAuthService.register.mockResolvedValue(registerResult);
      const res = mockResponse();

      const result = await controller.register(dto, res);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(mockAuthService.addRefreshTokenToResponse).toHaveBeenCalledWith(res, 'refresh');
      expect(result).toEqual({ user: { id: '2', email: 'new@test.com' }, accessToken: 'access' });
    });
  });

  describe('getNewTokens()', () => {
    it('should return new tokens when refresh token exists', async () => {
      const req = mockRequest({ refresh_token: 'valid-refresh' });
      const res = mockResponse();
      const tokensResult = { user: { id: '1' }, accessToken: 'new-access', refreshToken: 'new-refresh' };
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
    it('should clear refresh cookie and return true', async () => {
      const res = mockResponse();

      const result = await controller.logout(res);

      expect(mockAuthService.removeRefreshTokenFromResponse).toHaveBeenCalledWith(res);
      expect(result).toBe(true);
    });
  });
});
