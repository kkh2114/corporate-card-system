import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EmployeeRole } from '@/modules/employees/entities/employee.entity';

/**
 * 데이터 접근 범위 가드
 *
 * 역할별로 쿼리에 자동 필터를 적용합니다:
 * - Employee: 본인 데이터만
 * - Manager: 소속 부서원 데이터
 * - Finance/Admin: 전체 데이터
 * - Auditor: 전체 데이터 (읽기 전용)
 *
 * 이 가드는 request 객체에 dataAccessFilter를 설정합니다.
 * 서비스에서 이 필터를 사용하여 쿼리를 제한합니다.
 */
@Injectable()
export class DataAccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const filter = this.buildDataAccessFilter(user);
    request.dataAccessFilter = filter;

    return true;
  }

  private buildDataAccessFilter(user: {
    id: string;
    role: EmployeeRole;
    department?: string;
  }): DataAccessFilter {
    switch (user.role) {
      case EmployeeRole.EMPLOYEE:
        return {
          type: 'employee',
          employeeId: user.id,
        };

      case EmployeeRole.MANAGER:
        return {
          type: 'department',
          department: user.department,
          employeeId: user.id,
        };

      case EmployeeRole.FINANCE:
      case EmployeeRole.ADMIN:
        return {
          type: 'all',
        };

      case EmployeeRole.AUDITOR:
        return {
          type: 'all',
          readOnly: true,
        };

      default:
        return {
          type: 'employee',
          employeeId: user.id,
        };
    }
  }
}

export interface DataAccessFilter {
  type: 'employee' | 'department' | 'all';
  employeeId?: string;
  department?: string;
  readOnly?: boolean;
}
