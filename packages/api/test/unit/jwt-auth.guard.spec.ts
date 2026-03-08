import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  function createMockContext(): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  it('should allow access for @Public() decorated routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = createMockContext();
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should delegate to parent AuthGuard for non-public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const ctx = createMockContext();
    // Parent AuthGuard.canActivate returns Observable/Promise,
    // we just verify it doesn't return true immediately
    const result = guard.canActivate(ctx);
    expect(result).not.toBe(true);
  });
});
