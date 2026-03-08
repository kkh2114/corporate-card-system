import { ConfigService } from '@nestjs/config';

/**
 * Sentry 초기화
 * main.ts에서 bootstrap 전에 호출
 *
 * 사용법:
 *   import { initSentry } from './common/logger/sentry.init';
 *   // bootstrap() 이전에 호출
 *   initSentry();
 */
export function initSentry(configService?: ConfigService): void {
  const dsn = configService?.get<string>('SENTRY_DSN') || process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      integrations: [
        Sentry.httpIntegration(),
      ],
      // 민감 데이터 필터링
      beforeSend(event: any) {
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        if (event.request?.data) {
          const data = event.request.data;
          if (typeof data === 'object') {
            if (data.password) data.password = '[FILTERED]';
            if (data.cardNumber) data.cardNumber = '[FILTERED]';
          }
        }
        return event;
      },
    });
  } catch {
    // @sentry/node 미설치 시 무시
    console.warn('Sentry DSN configured but @sentry/node not installed. Skipping Sentry init.');
  }
}
