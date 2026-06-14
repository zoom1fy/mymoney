import { Auth } from './auth.decorator';

describe('Auth Decorator', () => {
  it('should be defined', () => {
    const decorator = Auth();
    expect(decorator).toBeDefined();
  });
});
