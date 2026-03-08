import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { ReceiptsModule } from './modules/receipts/receipts.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { VerificationModule } from './modules/verification/verification.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { LocationModule } from './modules/location/location.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ApprovalModule } from './modules/approval/approval.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuditModule } from './modules/audit/audit.module';
import { EncryptionModule } from './modules/encryption/encryption.module';
import { HealthModule } from './modules/health/health.module';
import { LlmModule } from './modules/llm/llm.module';
import { SettingsModule } from './modules/settings/settings.module';
import { LoggerModule } from './common/logger/logger.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ThrottleBehindProxyGuard } from './common/guards/throttle-behind-proxy.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_DATABASE', 'corporate_card'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),

    // Infrastructure modules (Global)
    LoggerModule,
    RedisModule,
    AuditModule,
    EncryptionModule,
    HealthModule,

    // Feature modules
    AuthModule,
    EmployeesModule,
    PoliciesModule,
    ReceiptsModule,
    TransactionsModule,
    VerificationModule,
    OcrModule,
    LocationModule,
    NotificationsModule,
    StatisticsModule,
    DashboardModule,
    ApprovalModule,
    LlmModule,
    SettingsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottleBehindProxyGuard },
  ],
})
export class AppModule {}
