import { RolesGuard } from '../../src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { EmployeeRole } from '../../src/modules/employees/entities/employee.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(
    user: { role: string } | null,
    method = 'GET',
    requiredRoles?: EmployeeRole[],
  ): ExecutionContext {
    const request = { user, method };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(requiredRoles ?? null);

    return context;
  }

  describe('no roles required', () => {
    it('should allow access when no roles are specified', () => {
      const ctx = createMockContext({ role: EmployeeRole.EMPLOYEE });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('no user', () => {
    it('should deny access when user is null', () => {
      const ctx = createMockContext(null, 'GET', [EmployeeRole.EMPLOYEE]);
      expect(guard.canActivate(ctx)).toBe(false);
    });
  });

  describe('role hierarchy', () => {
    it('EMPLOYEE can access EMPLOYEE endpoints', () => {
      const ctx = createMockContext(
        { role: EmployeeRole.EMPLOYEE },
        'GET',
        [EmployeeRole.EMPLOYEE],
      );
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('EMPLOYEE cannot access MANAGER endpoints', () => {
      const ctx = createMockContext(
        { role: EmployeeRole.EMPLOYEE },
        'GET',
        [EmployeeRole.MANAGER],
      );
      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('EMPLOYEE cannot access FINANCE endpoints', () => {
      const ctx = createMockContext(
        { role: EmployeeRole.EMPLOYEE },
        'GET',
        [EmployeeRole.FINANCE],
      );
      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('EMPLOYEE cannot access ADMIN endpoints', () => {
      const ctx = createMockContext(
        { role: EmployeeRole.EMPLOYEE },
        'GET',
        [EmployeeRole.ADMIN],
      );
      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('MANAGER can access EMPLOYEE endpoints (hierarchy)', () => {
      const ctx = createMockContext(
        { role: EmployeeRole.MANAGER },
        'GET',
        [EmployeeRole.EMPLOYEE],
      );
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('MANAGER can access MANAGER endpoints', () => {
      const ctx = createMockContext(
        { role: EmployeeRole.MANAGER },
        'GET',
        [EmployeeRole.MANAGER],
      );
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('MANAGER cannot access FINANCE endpoints', () => {
      const ctx = createMockContext(
        { role: EmployeeRole.MANAGER },
        'GET',
        [EmployeeRole.FINANCE],
      );
      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('FINANCE can access EMPLOYEE and MANAGER endpoints', () => {
      const ctxEmp = createMockContext(
        { role: EmployeeRole.FINANCE },
        'GET',
        [EmployeeRole.EMPLOYEE],
      );
      expect(guard.canActivate(ctxEmp)).toBe(true);

      const ctxMgr = createMockContext(
        { role: EmployeeRole.FINANCE },
        'GET',
        [EmployeeRole.MANAGER],
      );
      expect(guard.canActivate(ctxMgr)).toBe(true);
    });

    it('ADMIN can access all hierarchy levels', () => {
      for (const role of [EmployeeRole.EMPLOYEE, EmployeeRole.MANAGER, EmployeeRole.FINANCE, EmployeeRole.ADMIN]) {
        const ctx = createMockContext(
          { role: EmployeeRole.ADMIN },
          'GET',
          [role],
        );
        expect(guard.canActivate(ctx)).toBe(true);
      }
    });
  });

  describe('auditor special handling', () => {
    it('AUDITOR can access GET endpoints that include AUDITOR role', () => {
      const ctx = createMockContext(
        { role: EmployeeRole.AUDITOR },
        'GET',
        [EmployeeRole.AUDITOR],
      );
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('AUDITOR cannot access POST endpoints even if AUDITOR is required', () => {
      const ctx = createMockContext(
        { role: EmployeeRole.AUDITOR },
        'POST',
        [EmployeeRole.AUDITOR],
      );
      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('AUDITOR cannot access PUT endpoints', () => {
      const ctx = createMockContext(
        { role: EmployeeRole.AUDITOR },
        'PUT',
        [EmployeeRole.AUDITOR],
      );
      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('AUDITOR cannot access DELETE endpoints', () => {
      const ctx = createMockContext(
        { role: EmployeeRole.AUDITOR },
        'DELETE',
        [EmployeeRole.AUDITOR],
      );
      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('AUDITOR cannot access endpoints requiring EMPLOYEE (not in hierarchy)', () => {
      const ctx = createMockContext(
        { role: EmployeeRole.AUDITOR },
        'GET',
        [EmployeeRole.EMPLOYEE],
      );
      expect(guard.canActivate(ctx)).toBe(false);
    });
  });

  describe('multiple required roles', () => {
    it('should allow if user matches any required role', () => {
      const ctx = createMockContext(
        { role: EmployeeRole.FINANCE },
        'GET',
        [EmployeeRole.FINANCE, EmployeeRole.ADMIN],
      );
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow via hierarchy for any required role', () => {
      const ctx = createMockContext(
        { role: EmployeeRole.ADMIN },
        'GET',
        [EmployeeRole.EMPLOYEE, EmployeeRole.MANAGER],
      );
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('unknown role', () => {
    it('should deny access for unknown role', () => {
      const ctx = createMockContext(
        { role: 'unknown_role' },
        'GET',
        [EmployeeRole.EMPLOYEE],
      );
      expect(guard.canActivate(ctx)).toBe(false);
    });
  });
});
