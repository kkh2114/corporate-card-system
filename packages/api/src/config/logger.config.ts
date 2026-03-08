import { registerAs } from '@nestjs/config';

export default registerAs('logger', () => ({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  // 프로덕션: JSON 포맷 (로그 수집기 호환)
  // 개발: 가독성 높은 텍스트 포맷
  prettyPrint: process.env.NODE_ENV !== 'production',
  // Sentry 연동
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    enabled: !!process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  },
}));
