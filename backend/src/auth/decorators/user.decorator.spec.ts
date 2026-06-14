describe('CurrentUser Decorator factory', () => {
  const factoryFn = (data: string | undefined, ctx: any) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  };

  it('should return the full user from request', () => {
    const mockUser = { id: 'user-uuid-1', email: 'test@test.com' };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    };

    const result = factoryFn(undefined, mockContext);
    expect(result).toEqual(mockUser);
  });

  it('should return a specific field from user when data is provided', () => {
    const mockUser = { id: 'user-uuid-1', email: 'test@test.com' };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    };

    const result = factoryFn('id', mockContext);
    expect(result).toBe('user-uuid-1');
  });

  it('should return undefined if user is not on request', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ }),
      }),
    };

    const result = factoryFn(undefined, mockContext);
    expect(result).toBeUndefined();
  });

  it('should return undefined for a field if user has no such field', () => {
    const mockUser = { id: 'user-uuid-1' };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    };

    const result = factoryFn('nonexistent' as any, mockContext);
    expect(result).toBeUndefined();
  });
});
