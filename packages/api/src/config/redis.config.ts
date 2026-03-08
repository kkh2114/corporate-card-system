import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  keyPrefix: 'cc:',
  ttl: {
    refreshToken: 7 * 24 * 60 * 60,    // 7일
    tokenBlacklist: 15 * 60,            // 15분 (access token TTL)
    dailyUsage: 25 * 60 * 60,           // 25시간
    monthlyUsage: 32 * 24 * 60 * 60,    // 32일
    policy: 30 * 60,                     // 30분
    dashboardStats: 60,                  // 1분
    departmentStats: 5 * 60,             // 5분
    rateLimit: 60,                       // 1분
  },
}));
