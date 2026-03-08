import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AUDIT_KEY, AuditConfig } from '../decorators/audit.decorator';
import { AuditLogService } from '../../modules/audit/audit-log.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditConfig = this.reflector.get<AuditConfig>(
      AUDIT_KEY,
      context.getHandler(),
    );

    if (!auditConfig) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      tap({
        next: () => {
          this.auditLogService
            .create({
              actorId: user?.id,
              actorEmployeeId: user?.employeeId,
              actorRole: user?.role,
              actorIp: request.ip,
              actorUserAgent: request.headers['user-agent'],
              action: auditConfig.action,
              category: auditConfig.category,
              severity: auditConfig.severity || 'INFO',
              resourceType: auditConfig.resourceType,
              resourceId: request.params?.id,
              description: auditConfig.description,
              requestMethod: request.method,
              requestPath: request.originalUrl,
              requestBody: this.maskSensitiveData(request.body),
            })
            .catch((err) => this.logger.error('Failed to write audit log', err));
        },
        error: (error) => {
          if (auditConfig.category === 'AUTH') {
            this.auditLogService
              .create({
                actorId: user?.id,
                actorEmployeeId: user?.employeeId || request.body?.employeeId,
                actorRole: user?.role,
                actorIp: request.ip,
                actorUserAgent: request.headers['user-agent'],
                action: `${auditConfig.action}_FAILED`,
                category: 'SECURITY',
                severity: 'WARNING',
                description: `${auditConfig.description} 실패: ${error.message}`,
                requestMethod: request.method,
                requestPath: request.originalUrl,
                requestBody: this.maskSensitiveData(request.body),
              })
              .catch((err) => this.logger.error('Failed to write audit log', err));
          }
        },
      }),
    );
  }

  private maskSensitiveData(body: any): Record<string, any> | null {
    if (!body) return null;
    const masked = { ...body };
    const sensitiveFields = [
      'password',
      'currentPassword',
      'newPassword',
      'cardNumber',
      'businessNumber',
      'phone',
      'refreshToken',
    ];
    for (const field of sensitiveFields) {
      if (masked[field]) {
        masked[field] = '***MASKED***';
      }
    }
    return masked;
  }
}
