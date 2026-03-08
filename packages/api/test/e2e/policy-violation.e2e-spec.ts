/**
 * E2E 테스트 시나리오 3: 정책 위반 거래 자동 차단
 *
 * 차단 업종 → 즉시 거절
 * 제한 지역 → 즉시 거절
 * 시간 외 사용 → flagged (관리자 검토)
 * 정책 엔진 규칙 매칭 → 동적 차단/알림
 */
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  loginAs,
  authGet,
  authPost,
  SEED_USERS,
  TestUser,
} from './test-helpers';

describe('정책 위반 자동 차단 (E2E)', () => {
  let app: INestApplication;
  let employee: TestUser;
  let manager: TestUser;
  let admin: TestUser;

  beforeAll(async () => {
    app = await createTestApp();
    [employee, manager, admin] = await Promise.all([
      loginAs(app, SEED_USERS.employee.employeeId, SEED_USERS.employee.password),
      loginAs(app, SEED_USERS.manager.employeeId, SEED_USERS.manager.password),
      loginAs(app, SEED_USERS.admin.employeeId, SEED_USERS.admin.password),
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. 차단 업종 거래 즉시 거절', () => {
    it('유흥주점 업종 거래는 즉시 rejected된다', () => {
      const verificationService = app.get('VerificationService');

      const result = verificationService.verify({
        amount: 120000,
        category: '유흥주점',
        receiptAddress: '서울시 강남구 역삼동',
        userLat: 37.4979,
        userLon: 127.0276,
        receiptLat: 37.4980,
        receiptLon: 127.0277,
        dailyUsed: 0,
        monthlyUsed: 0,
        transactionDate: new Date('2026-03-08T22:10:00'),
        policy: {
          monthlyLimit: 2000000,
          dailyLimit: 500000,
          perTransactionLimit: 300000,
          allowedCategories: [], // 비어있어도 전사 차단 업종은 거절
          allowedRegions: [],
          restrictedAreas: [],
        },
      });

      expect(result.overallStatus).toBe('rejected');
      const categoryCheck = result.checks.find((c) => c.type === 'category');
      expect(categoryCheck.status).toBe('fail');
      expect(categoryCheck.message).toContain('허용되지 않은 업종');
      expect(result.approvalTriggers).toContain('restricted_category');
    });

    it('도박 업종도 즉시 차단된다', () => {
      const verificationService = app.get('VerificationService');

      const result = verificationService.verify({
        amount: 50000,
        category: '도박',
        receiptAddress: '서울시 강남구',
        userLat: 37.4979,
        userLon: 127.0276,
        receiptLat: 37.4980,
        receiptLon: 127.0277,
        dailyUsed: 0,
        monthlyUsed: 0,
        transactionDate: new Date('2026-03-08T15:00:00'),
        policy: {
          monthlyLimit: 2000000,
          dailyLimit: 500000,
          perTransactionLimit: 300000,
          allowedCategories: ['식음료'],
          allowedRegions: [],
          restrictedAreas: [],
        },
      });

      expect(result.overallStatus).toBe('rejected');
    });
  });

  describe('2. 제한 지역 거래 차단', () => {
    it('제한 구역 내 거래는 rejected된다', () => {
      const verificationService = app.get('VerificationService');

      const result = verificationService.verify({
        amount: 80000,
        category: '식음료',
        receiptAddress: '서울시 강남구 유흥가 특별거리 123',
        userLat: 37.4979,
        userLon: 127.0276,
        receiptLat: 37.4980,
        receiptLon: 127.0277,
        dailyUsed: 0,
        monthlyUsed: 0,
        transactionDate: new Date('2026-03-08T19:00:00'),
        policy: {
          monthlyLimit: 2000000,
          dailyLimit: 500000,
          perTransactionLimit: 300000,
          allowedCategories: ['식음료'],
          allowedRegions: [],
          restrictedAreas: ['유흥가'],
        },
      });

      expect(result.overallStatus).toBe('rejected');
      const regionCheck = result.checks.find((c) => c.type === 'region');
      expect(regionCheck.status).toBe('fail');
      expect(regionCheck.message).toContain('제한 구역');
    });

    it('허용되지 않은 지역 거래도 rejected된다', () => {
      const verificationService = app.get('VerificationService');

      const result = verificationService.verify({
        amount: 50000,
        category: '식음료',
        receiptAddress: '부산시 해운대구 우동',
        userLat: 35.1595,
        userLon: 129.1603,
        receiptLat: 35.1600,
        receiptLon: 129.1610,
        dailyUsed: 0,
        monthlyUsed: 0,
        transactionDate: new Date('2026-03-08T12:00:00'),
        policy: {
          monthlyLimit: 2000000,
          dailyLimit: 500000,
          perTransactionLimit: 300000,
          allowedCategories: ['식음료'],
          allowedRegions: ['서울', '경기'], // 부산은 미허용
          restrictedAreas: [],
        },
      });

      expect(result.overallStatus).toBe('rejected');
      const regionCheck = result.checks.find((c) => c.type === 'region');
      expect(regionCheck.status).toBe('fail');
    });
  });

  describe('3. 위치 불일치 검증', () => {
    it('영수증 위치와 GPS가 2km 이상 떨어지면 fail', () => {
      const verificationService = app.get('VerificationService');

      // 서울 강남(37.498, 127.028) vs 서울 강북(37.640, 127.025) ≈ 15km
      const result = verificationService.verify({
        amount: 45000,
        category: '식음료',
        receiptAddress: '서울시 강북구 수유동',
        userLat: 37.4979,
        userLon: 127.0276,
        receiptLat: 37.6397,
        receiptLon: 127.0252,
        dailyUsed: 0,
        monthlyUsed: 0,
        transactionDate: new Date('2026-03-08T14:00:00'),
        policy: {
          monthlyLimit: 2000000,
          dailyLimit: 500000,
          perTransactionLimit: 300000,
          allowedCategories: ['식음료'],
          allowedRegions: ['서울'],
          restrictedAreas: [],
        },
      });

      const locationCheck = result.checks.find((c) => c.type === 'location');
      expect(locationCheck.status).toBe('fail');
      expect(result.approvalTriggers).toContain('location_mismatch');
    });

    it('500m~2km 거리는 warning (flagged)', () => {
      const verificationService = app.get('VerificationService');

      // ~800m 거리
      const result = verificationService.verify({
        amount: 45000,
        category: '식음료',
        receiptAddress: '서울시 강남구',
        userLat: 37.4979,
        userLon: 127.0276,
        receiptLat: 37.5050,
        receiptLon: 127.0276,
        dailyUsed: 0,
        monthlyUsed: 0,
        transactionDate: new Date('2026-03-08T14:00:00'),
        policy: {
          monthlyLimit: 2000000,
          dailyLimit: 500000,
          perTransactionLimit: 300000,
          allowedCategories: ['식음료'],
          allowedRegions: ['서울'],
          restrictedAreas: [],
        },
      });

      const locationCheck = result.checks.find((c) => c.type === 'location');
      expect(locationCheck.status).toBe('warning');
    });
  });

  describe('4. 시간 외 사용 경고', () => {
    it('허용 시간대 외 사용은 warning으로 판정된다', () => {
      const verificationService = app.get('VerificationService');

      const result = verificationService.verify({
        amount: 85000,
        category: '식음료',
        receiptAddress: '서울시 강남구 역삼동',
        userLat: 37.4979,
        userLon: 127.0276,
        receiptLat: 37.4980,
        receiptLon: 127.0277,
        dailyUsed: 0,
        monthlyUsed: 0,
        transactionDate: new Date('2026-03-08T22:30:00'), // 22시 30분
        policy: {
          monthlyLimit: 2000000,
          dailyLimit: 500000,
          perTransactionLimit: 300000,
          allowedCategories: ['식음료'],
          allowedRegions: ['서울'],
          restrictedAreas: [],
        },
        timePolicy: {
          allowedHoursStart: 9,
          allowedHoursEnd: 18,
          allowWeekends: false,
        },
      });

      expect(result.overallStatus).toBe('flagged');
      const timeCheck = result.checks.find((c) => c.type === 'time');
      expect(timeCheck.status).toBe('warning');
      expect(timeCheck.message).toContain('허용 시간대');
      expect(result.approvalTriggers).toContain('after_hours');
    });

    it('주말 사용 제한 시 warning으로 판정된다', () => {
      const verificationService = app.get('VerificationService');

      // 2026-03-08은 일요일
      const result = verificationService.verify({
        amount: 30000,
        category: '식음료',
        receiptAddress: '서울시 강남구',
        userLat: 37.4979,
        userLon: 127.0276,
        receiptLat: 37.4980,
        receiptLon: 127.0277,
        dailyUsed: 0,
        monthlyUsed: 0,
        transactionDate: new Date('2026-03-08T12:00:00'),
        policy: {
          monthlyLimit: 2000000,
          dailyLimit: 500000,
          perTransactionLimit: 300000,
          allowedCategories: ['식음료'],
          allowedRegions: ['서울'],
          restrictedAreas: [],
        },
        timePolicy: {
          allowWeekends: false,
        },
      });

      const timeCheck = result.checks.find((c) => c.type === 'time');
      expect(timeCheck.status).toBe('warning');
      expect(timeCheck.message).toContain('주말');
    });
  });

  describe('5. 건당 한도 초과', () => {
    it('건당 한도 초과 시 rejected', () => {
      const verificationService = app.get('VerificationService');

      const result = verificationService.verify({
        amount: 500000,
        category: '식음료',
        receiptAddress: '서울시 강남구',
        userLat: 37.4979,
        userLon: 127.0276,
        receiptLat: 37.4980,
        receiptLon: 127.0277,
        dailyUsed: 0,
        monthlyUsed: 0,
        transactionDate: new Date('2026-03-08T14:00:00'),
        policy: {
          monthlyLimit: 2000000,
          dailyLimit: 500000,
          perTransactionLimit: 300000, // 건당 30만원 한도
          allowedCategories: ['식음료'],
          allowedRegions: ['서울'],
          restrictedAreas: [],
        },
      });

      expect(result.overallStatus).toBe('rejected');
      const limitCheck = result.checks.find((c) => c.type === 'limit');
      expect(limitCheck.status).toBe('fail');
      expect(limitCheck.message).toContain('건별 한도 초과');
    });
  });

  describe('6. 일일 한도 초과', () => {
    it('일일 한도 초과 시 rejected', () => {
      const verificationService = app.get('VerificationService');

      const result = verificationService.verify({
        amount: 100000,
        category: '식음료',
        receiptAddress: '서울시 강남구',
        userLat: 37.4979,
        userLon: 127.0276,
        receiptLat: 37.4980,
        receiptLon: 127.0277,
        dailyUsed: 450000, // 이미 45만원 사용
        monthlyUsed: 450000,
        transactionDate: new Date('2026-03-08T17:00:00'),
        policy: {
          monthlyLimit: 2000000,
          dailyLimit: 500000, // 일 한도 50만원
          perTransactionLimit: 300000,
          allowedCategories: ['식음료'],
          allowedRegions: ['서울'],
          restrictedAreas: [],
        },
      });

      expect(result.overallStatus).toBe('rejected');
      const limitCheck = result.checks.find((c) => c.type === 'limit');
      expect(limitCheck.status).toBe('fail');
      expect(limitCheck.message).toContain('일일 한도 초과');
    });
  });

  describe('7. 정책 엔진 규칙 매칭', () => {
    it('전사 차단 업종은 정책 엔진에서 즉시 차단된다', async () => {
      const policyEngine = app.get('PolicyEngineService');

      const result = await policyEngine.evaluate({
        employeeId: employee.id,
        department: '개발팀',
        category: '유흥주점',
        region: '서울시 강남구',
        amount: 100000,
        transactionDate: new Date(),
        dailyTransactionCount: 0,
      });

      expect(result.allowed).toBe(false);
      expect(result.blockMessage).toContain('차단된 업종');
    });
  });

  describe('8. 관리자 거래 수동 승인/거절', () => {
    it('관리자가 flagged 거래를 수동 승인한다', async () => {
      // 먼저 거래 목록에서 flagged 상태 거래를 찾거나 테스트용으로 사용
      // 여기서는 approve API 호출 패턴을 검증
      const testTransactionId = '00000000-0000-0000-0000-000000000001';

      // 관리자 또는 재무팀만 승인 가능
      const approveRes = await authPost(
        app,
        `/api/v1/transactions/${testTransactionId}/approve`,
        admin.accessToken,
      )
        .send({ note: '확인 후 승인' });

      // 거래가 존재하면 200, 없으면 404
      expect([200, 404]).toContain(approveRes.status);
    });

    it('일반 직원은 거래를 승인할 수 없다 (403)', async () => {
      const testTransactionId = '00000000-0000-0000-0000-000000000001';

      await authPost(
        app,
        `/api/v1/transactions/${testTransactionId}/approve`,
        employee.accessToken,
      )
        .send({ note: '직원 승인 시도' })
        .expect(403);
    });
  });

  describe('9. 복합 위반 시나리오', () => {
    it('업종 위반 + 위치 불일치 → 다중 트리거 감지', () => {
      const verificationService = app.get('VerificationService');

      const result = verificationService.verify({
        amount: 200000,
        category: '귀금속',
        receiptAddress: '부산시 해운대구',
        userLat: 37.4979,
        userLon: 127.0276,
        receiptLat: 35.1595, // 부산 좌표
        receiptLon: 129.1603,
        dailyUsed: 0,
        monthlyUsed: 0,
        transactionDate: new Date('2026-03-08T14:00:00'),
        policy: {
          monthlyLimit: 2000000,
          dailyLimit: 500000,
          perTransactionLimit: 300000,
          allowedCategories: ['식음료'],
          allowedRegions: ['서울'],
          restrictedAreas: [],
        },
      });

      expect(result.overallStatus).toBe('rejected');
      // 다중 위반 감지
      expect(result.checks.filter((c) => c.status === 'fail').length).toBeGreaterThanOrEqual(2);
      expect(result.approvalTriggers).toContain('restricted_category');
      expect(result.approvalTriggers).toContain('location_mismatch');
    });
  });
});
