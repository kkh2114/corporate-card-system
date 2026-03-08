import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

export interface TestUser {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * E2E 테스트용 앱 인스턴스 생성
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

/**
 * 테스트용 로그인 헬퍼
 */
export async function loginAs(
  app: INestApplication,
  employeeId: string,
  password: string,
): Promise<TestUser> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ employeeId, password })
    .expect(200);

  return {
    id: response.body.user.id,
    employeeId: response.body.user.employeeId,
    name: response.body.user.name,
    role: response.body.user.role,
    department: response.body.user.department,
    accessToken: response.body.accessToken,
    refreshToken: response.body.refreshToken,
  };
}

/**
 * 인증된 요청 헬퍼
 */
export function authGet(app: INestApplication, url: string, token: string) {
  return request(app.getHttpServer())
    .get(url)
    .set('Authorization', `Bearer ${token}`);
}

export function authPost(app: INestApplication, url: string, token: string) {
  return request(app.getHttpServer())
    .post(url)
    .set('Authorization', `Bearer ${token}`);
}

export function authPut(app: INestApplication, url: string, token: string) {
  return request(app.getHttpServer())
    .put(url)
    .set('Authorization', `Bearer ${token}`);
}

/**
 * 시드 데이터 기반 테스트 사용자 정보
 * (infrastructure/database/seeds/seed-data.sql 기준)
 */
export const SEED_USERS = {
  employee: { employeeId: 'EMP001', password: 'test1234!' },
  manager: { employeeId: 'MGR001', password: 'test1234!' },
  finance: { employeeId: 'FIN001', password: 'test1234!' },
  admin: { employeeId: 'ADM001', password: 'test1234!' },
  auditor: { employeeId: 'AUD001', password: 'test1234!' },
};
