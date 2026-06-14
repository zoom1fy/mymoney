import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { WsJwtGuard } from './ws-jwt.guard';

describe('WsJwtGuard', () => {
  let guard: WsJwtGuard;
  let mockJwtService: any;

  beforeEach(() => {
    mockJwtService = {
      verify: jest.fn(),
    };
    guard = new WsJwtGuard(mockJwtService);
  });

  const createMockContext = (auth: any = {}, headers: any = {}) => ({
    switchToWs: () => ({
      getClient: () => ({
        handshake: { auth, headers },
      }),
    }),
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true and set client.user when token is valid in auth', () => {
    const payload = { id: 'user-uuid-1' };
    mockJwtService.verify.mockReturnValue(payload);

    const client: any = { handshake: { auth: { token: 'valid-token' }, headers: {} } };
    const context: any = { switchToWs: () => ({ getClient: () => client }) };

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(client.user).toEqual(payload);
    expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
  });

  it('should extract token from Authorization header', () => {
    const payload = { id: 'user-uuid-1' };
    mockJwtService.verify.mockReturnValue(payload);

    const client: any = { handshake: { auth: {}, headers: { authorization: 'Bearer header-token' } } };
    const context: any = { switchToWs: () => ({ getClient: () => client }) };

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(client.user).toEqual(payload);
    expect(mockJwtService.verify).toHaveBeenCalledWith('header-token');
  });

  it('should throw UnauthorizedException when no token provided', () => {
    const context: any = createMockContext({}, {});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('No token');
  });

  it('should throw UnauthorizedException when token is invalid', () => {
    mockJwtService.verify.mockImplementation(() => { throw new Error(); });

    const context: any = createMockContext({ token: 'bad-token' }, {});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Invalid token');
  });
});
