import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { EmployeeRole } from '@/modules/employees/entities/employee.entity';

// Role hierarchy: higher level inherits lower level permissions
const ROLE_HIERARCHY: Record<EmployeeRole, number> = {
  [EmployeeRole.EMPLOYEE]: 1,
  [EmployeeRole.MANAGER]: 2,
  [EmployeeRole.FINANCE]: 3,
  [EmployeeRole.ADMIN]: 4,
  [EmployeeRole.AUDITOR]: 0, // Separate track: read-only
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<EmployeeRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    // Auditor: read-only access on GET requests only
    if (user.role === EmployeeRole.AUDITOR) {
      const method = context.switchToHttp().getRequest().method;
      return method === 'GET' && requiredRoles.includes(EmployeeRole.AUDITOR);
    }

    // Hierarchy-based: user's level must be >= required role's level
    const userLevel = ROLE_HIERARCHY[user.role as EmployeeRole] ?? 0;
    return requiredRoles.some((role) => userLevel >= ROLE_HIERARCHY[role]);
  }
}
