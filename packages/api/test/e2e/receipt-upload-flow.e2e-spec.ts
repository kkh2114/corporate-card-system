/**
 * E2E 테스트 시나리오 1: 영수증 업로드 전체 플로우
 *
 * 로그인 → 영수증 업로드 → OCR 처리 → 검증(위치/업종/지역/한도/시간) → 결과 확인
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  createTestApp,
  loginAs,
  authGet,
  authPost,
  SEED_USERS,
  TestUser,
} from './test-helpers';

describe('영수증 업로드 전체 플로우 (E2E)', () => {
  let app: INestApplication;
  let employee: TestUser;

  beforeAll(async () => {
    app = await createTestApp();
    employee = await loginAs(
      app,
      SEED_USERS.employee.employeeId,
      SEED_USERS.employee.password,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. 인증 플로우', () => {
    it('직원이 사번과 비밀번호로 로그인하면 JWT 토큰을 받는다', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          employeeId: SEED_USERS.employee.employeeId,
          password: SEED_USERS.employee.password,
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('expiresIn');
      expect(res.body.user).toMatchObject({
        employeeId: SEED_USERS.employee.employeeId,
        role: 'employee',
      });
    });

    it('잘못된 비밀번호로 로그인하면 401을 반환한다', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          employeeId: SEED_USERS.employee.employeeId,
          password: 'wrong_password',
        })
        .expect(401);
    });

    it('인증 없이 API를 호출하면 401을 반환한다', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/transactions')
        .expect(401);
    });
  });

  describe('2. 영수증 업로드 → OCR → 검증 → 승인', () => {
    let receiptId: string;
    let transactionId: string;

    it('직원이 영수증 이미지를 업로드한다', async () => {
      const res = await authPost(app, '/api/v1/receipts/upload', employee.accessToken)
        .field('gps[latitude]', '37.4979')
        .field('gps[longitude]', '127.0276')
        .field('gps[accuracy]', '15')
        .field('gps[timestamp]', new Date().toISOString())
        .field('metadata[note]', '고객 미팅 식사')
        .attach('file', Buffer.from('fake-image-data'), {
          filename: 'receipt.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(res.body).toHaveProperty('receiptId');
      expect(res.body.status).toBe('processing');
      receiptId = res.body.receiptId;
      transactionId = res.body.transactionId;
    });

    it('영수증 OCR 처리 결과를 조회할 수 있다', async () => {
      // OCR 처리가 비동기이므로 폴링 또는 직접 조회
      const res = await authGet(
        app,
        `/api/v1/receipts/${receiptId}`,
        employee.accessToken,
      ).expect(200);

      expect(res.body).toHaveProperty('id', receiptId);
      expect(res.body).toHaveProperty('status');
      // OCR 결과 필드 확인 (완료 시)
      if (res.body.status === 'completed') {
        expect(res.body).toHaveProperty('merchantName');
        expect(res.body).toHaveProperty('amount');
        expect(res.body).toHaveProperty('category');
      }
    });

    it('생성된 거래 내역을 조회할 수 있다', async () => {
      if (!transactionId) return;

      const res = await authGet(
        app,
        `/api/v1/transactions/${transactionId}`,
        employee.accessToken,
      ).expect(200);

      expect(res.body).toHaveProperty('id', transactionId);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('transactionNumber');
      expect(['pending', 'approved', 'rejected', 'flagged']).toContain(
        res.body.status,
      );
    });

    it('직원은 본인의 거래 내역 목록을 조회할 수 있다', async () => {
      const res = await authGet(
        app,
        '/api/v1/transactions',
        employee.accessToken,
      ).expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('metadata');
      expect(res.body.metadata).toHaveProperty('total');
      expect(res.body.metadata).toHaveProperty('page');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('3. 정상 거래 검증 통과 시나리오', () => {
    it('허용 업종 + 허용 지역 + 한도 이내 거래는 자동 승인된다', async () => {
      // 검증 서비스를 직접 테스트 (서비스 레벨)
      const verificationModule = app.get('VerificationService');

      const result = verificationModule.verify({
        amount: 45000,
        category: '식음료',
        receiptAddress: '서울시 강남구 테헤란로 123',
        userLat: 37.4979,
        userLon: 127.0276,
        receiptLat: 37.4980,
        receiptLon: 127.0277,
        dailyUsed: 100000,
        monthlyUsed: 500000,
        transactionDate: new Date('2026-03-08T14:30:00'),
        policy: {
          monthlyLimit: 2000000,
          dailyLimit: 500000,
          perTransactionLimit: 300000,
          allowedCategories: ['식음료', '교통', 'IT/소프트웨어'],
          allowedRegions: ['서울', '경기'],
          restrictedAreas: [],
        },
      });

      expect(result.overallStatus).toBe('approved');
      expect(result.checks).toHaveLength(5);
      expect(result.checks.every((c) => c.status === 'pass')).toBe(true);
      expect(result.approvalRequired).toBe(false);
      expect(result.message).toBe('모든 검증을 통과했습니다.');
    });
  });

  describe('4. 토큰 갱신 플로우', () => {
    it('리프레시 토큰으로 새 액세스 토큰을 발급받는다', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${employee.refreshToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('expiresIn');

      // 새 토큰으로 API 호출 가능 확인
      await authGet(app, '/api/v1/transactions', res.body.accessToken)
        .expect(200);
    });
  });

  describe('5. 로그아웃 플로우', () => {
    it('로그아웃 후 기존 토큰으로 접근 불가', async () => {
      // 별도 세션으로 로그인
      const tempUser = await loginAs(
        app,
        SEED_USERS.employee.employeeId,
        SEED_USERS.employee.password,
      );

      // 로그아웃
      await authPost(app, '/api/v1/auth/logout', tempUser.accessToken)
        .expect(200);

      // 로그아웃 후 토큰이 블랙리스트에 등록됨
      // (JwtAuthGuard에서 블랙리스트 체크)
      await authGet(app, '/api/v1/transactions', tempUser.accessToken)
        .expect(401);
    });
  });
});
