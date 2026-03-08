import { AuditLogInterceptor } from '../../src/common/interceptors/audit-log.interceptor';
import { Reflector } from '@nestjs/core';
import { AuditLogService } from '../../src/modules/audit/audit-log.service';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AUDIT_KEY } from '../../src/common/decorators/audit.decorator';

describe('AuditLogInterceptor', () => {
  let interceptor: AuditLogInterceptor;
  let reflector: Reflector;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    reflector = new Reflector();
    auditLogService = {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
    } as any;
    interceptor = new AuditLogInterceptor(reflector, auditLogService);
  });

  function createMockContext(
    user: any = { id: 'u1', employeeId: 'EMP-001', role: 'admin' },
    body: any = {},
    params: any = {},
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          body,
          params,
          ip: '127.0.0.1',
          method: 'POST',
          originalUrl: '/api/v1/auth/login',
          headers: { 'user-agent': 'test-agent' },
        }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  function createCallHandler(result: any = {}): CallHandler {
    return { handle: () => of(result) };
  }

  describe('when no audit config', () => {
    it('should pass through without logging', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);
      const ctx = createMockContext();
      const handler = createCallHandler();

      interceptor.intercept(ctx, handler).subscribe({
        complete: () => {
          expect(auditLogService.create).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('when audit config present', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        action: 'LOGIN',
        category: 'AUTH',
        severity: 'INFO',
        description: '사용자 로그인',
      });
    });

    it('should create audit log on success', (done) => {
      const ctx = createMockContext();
      const handler = createCallHandler({ success: true });

      interceptor.intercept(ctx, handler).subscribe({
        complete: () => {
          expect(auditLogService.create).toHaveBeenCalledWith(
            expect.objectContaining({
              actorId: 'u1',
              actorEmployeeId: 'EMP-001',
              action: 'LOGIN',
              category: 'AUTH',
              actorIp: '127.0.0.1',
            }),
          );
          done();
        },
      });
    });

    it('should mask sensitive fields in request body', (done) => {
      const ctx = createMockContext(
        { id: 'u1', employeeId: 'EMP-001', role: 'employee' },
        { employeeId: 'EMP-001', password: 'secret123', cardNumber: '1234567890123456' },
      );
      const handler = createCallHandler();

      interceptor.intercept(ctx, handler).subscribe({
        complete: () => {
          const call = auditLogService.create.mock.calls[0][0];
          expect(call.requestBody.password).toBe('***MASKED***');
          expect(call.requestBody.cardNumber).toBe('***MASKED***');
          expect(call.requestBody.employeeId).toBe('EMP-001'); // not sensitive
          done();
        },
      });
    });

    it('should mask refreshToken in body', (done) => {
      const ctx = createMockContext(
        { id: 'u1', employeeId: 'EMP-001', role: 'employee' },
        { refreshToken: 'some-refresh-token' },
      );
      const handler = createCallHandler();

      interceptor.intercept(ctx, handler).subscribe({
        complete: () => {
          const call = auditLogService.create.mock.calls[0][0];
          expect(call.requestBody.refreshToken).toBe('***MASKED***');
          done();
        },
      });
    });
  });

  describe('on AUTH error', () => {
    it('should log failed AUTH event as SECURITY category', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        action: 'LOGIN',
        category: 'AUTH',
        description: '사용자 로그인',
      });

      const ctx = createMockContext(
        null,
        { employeeId: 'EMP-001', password: 'wrong' },
      );
      const error = new Error('Unauthorized');
      const handler: CallHandler = {
        handle: () => throwError(() => error),
      };

      interceptor.intercept(ctx, handler).subscribe({
        error: () => {
          expect(auditLogService.create).toHaveBeenCalledWith(
            expect.objectContaining({
              action: 'LOGIN_FAILED',
              category: 'SECURITY',
              severity: 'WARNING',
              actorEmployeeId: 'EMP-001',
            }),
          );
          done();
        },
      });
    });
  });
});
