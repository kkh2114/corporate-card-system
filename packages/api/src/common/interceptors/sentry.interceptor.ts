import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Sentry SDK가 설치되어 있을 때만 캡처
        try {
          const Sentry = require('@sentry/node');
          if (Sentry.isInitialized && Sentry.isInitialized()) {
            const request = context.switchToHttp().getRequest();
            Sentry.withScope((scope: any) => {
              scope.setTag('url', request.url);
              scope.setTag('method', request.method);
              scope.setUser({
                id: request.user?.id,
                username: request.user?.employeeId,
              });
              scope.setExtra('requestId', request['requestId']);
              scope.setExtra('body', request.body);
              Sentry.captureException(error);
            });
          }
        } catch {
          // Sentry 미설치 시 무시
        }
        return throwError(() => error);
      }),
    );
  }
}
