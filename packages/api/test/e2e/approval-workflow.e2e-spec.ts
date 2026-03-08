/**
 * E2E 테스트 시나리오 2: 한도 초과 승인 워크플로우
 *
 * 한도 초과 거래 → 승인 요청 생성 → 부서장 승인 → 재무팀 승인 전체 플로우
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

describe('승인 워크플로우 (E2E)', () => {
  let app: INestApplication;
  let employee: TestUser;
  let manager: TestUser;
  let finance: TestUser;
  let admin: TestUser;

  beforeAll(async () => {
    app = await createTestApp();
    [employee, manager, finance, admin] = await Promise.all([
      loginAs(app, SEED_USERS.employee.employeeId, SEED_USERS.employee.password),
      loginAs(app, SEED_USERS.manager.employeeId, SEED_USERS.manager.password),
      loginAs(app, SEED_USERS.finance.employeeId, SEED_USERS.finance.password),
      loginAs(app, SEED_USERS.admin.employeeId, SEED_USERS.admin.password),
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. 한도 초과 검증 → 자동 거절', () => {
    it('월 한도 초과 거래는 검증 시 rejected로 판정된다', () => {
      const verificationService = app.get('VerificationService');

      const result = verificationService.verify({
        amount: 120000,
        category: '식음료',
        receiptAddress: '서울시 강남구 역삼동',
        userLat: 37.4979,
        userLon: 127.0276,
        receiptLat: 37.4980,
        receiptLon: 127.0277,
        dailyUsed: 0,
        monthlyUsed: 1450000, // 기존 145만원 사용
        transactionDate: new Date('2026-03-08T16:45:00'),
        policy: {
          monthlyLimit: 1500000, // 월 한도 150만원
          dailyLimit: 500000,
          perTransactionLimit: 300000,
          allowedCategories: ['식음료', '교통'],
          allowedRegions: ['서울'],
          restrictedAreas: [],
        },
      });

      expect(result.overallStatus).toBe('rejected');
      expect(result.approvalRequired).toBe(true);
      expect(result.approvalTriggers).toContain('limit_exceeded');

      // 한도 검증이 실패했는지 확인
      const limitCheck = result.checks.find((c) => c.type === 'limit');
      expect(limitCheck.status).toBe('fail');
      expect(limitCheck.message).toContain('월간 한도 초과');
    });
  });

  describe('2. 소액 한도 초과 → 부서장 1단계 승인', () => {
    let approvalRequestId: string;

    it('직원이 한도 초과 승인 요청을 생성한다 (초과액 7만원)', async () => {
      const res = await authPost(app, '/api/v1/approvals', employee.accessToken)
        .send({
          transactionId: '00000000-0000-0000-0000-000000000001', // 테스트용 UUID
          trigger: 'limit_exceeded',
          requestedAmount: 120000,
          exceededAmount: 70000, // 7만원 초과 → Manager 1단계
          reason: '팀 회식 비용, 월 한도 초과',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('pending');
      expect(res.body.totalSteps).toBe(1); // ~10만원: Manager만
      expect(res.body.currentStep).toBe(0);
      expect(res.body.steps).toHaveLength(1);
      expect(res.body.steps[0].approverRole).toBe('manager');

      approvalRequestId = res.body.id;
    });

    it('부서장이 대기 중인 승인 요청을 조회한다', async () => {
      const res = await authGet(
        app,
        '/api/v1/approvals/pending',
        manager.accessToken,
      ).expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const myRequest = res.body.find((r) => r.id === approvalRequestId);
      expect(myRequest).toBeDefined();
      expect(myRequest.status).toBe('pending');
    });

    it('부서장이 승인 처리한다', async () => {
      const res = await authPost(
        app,
        `/api/v1/approvals/${approvalRequestId}/process`,
        manager.accessToken,
      )
        .send({
          action: 'approve',
          comment: '팀 회식 확인, 승인합니다.',
        })
        .expect(200);

      expect(res.body.status).toBe('approved'); // 1단계뿐이므로 최종 승인
      expect(res.body.steps[0].status).toBe('approved');
      expect(res.body.steps[0].comment).toBe('팀 회식 확인, 승인합니다.');
    });

    it('직원이 승인 결과를 확인한다', async () => {
      const res = await authGet(
        app,
        `/api/v1/approvals/${approvalRequestId}`,
        employee.accessToken,
      ).expect(200);

      expect(res.body.status).toBe('approved');
    });
  });

  describe('3. 고액 한도 초과 → 부서장 + 재무팀 2단계 승인', () => {
    let approvalRequestId: string;

    it('직원이 고액 초과 승인 요청을 생성한다 (초과액 30만원)', async () => {
      const res = await authPost(app, '/api/v1/approvals', employee.accessToken)
        .send({
          transactionId: '00000000-0000-0000-0000-000000000002',
          trigger: 'limit_exceeded',
          requestedAmount: 450000,
          exceededAmount: 300000, // 30만원 초과 → Manager + Finance 2단계
          reason: '대형 고객사 접대 비용',
        })
        .expect(201);

      expect(res.body.totalSteps).toBe(2);
      expect(res.body.steps).toHaveLength(2);
      expect(res.body.steps[0].approverRole).toBe('manager');
      expect(res.body.steps[1].approverRole).toBe('finance');

      approvalRequestId = res.body.id;
    });

    it('부서장이 1단계 승인한다 → 상태가 escalated로 변경', async () => {
      const res = await authPost(
        app,
        `/api/v1/approvals/${approvalRequestId}/process`,
        manager.accessToken,
      )
        .send({ action: 'approve', comment: '접대 비용 확인' })
        .expect(200);

      expect(res.body.status).toBe('escalated');
      expect(res.body.currentStep).toBe(1);
      expect(res.body.steps[0].status).toBe('approved');
      expect(res.body.steps[1].status).toBe('pending');
    });

    it('일반 직원은 승인 처리할 수 없다 (403)', async () => {
      await authPost(
        app,
        `/api/v1/approvals/${approvalRequestId}/process`,
        employee.accessToken,
      )
        .send({ action: 'approve' })
        .expect(403);
    });

    it('재무팀이 2단계 승인한다 → 최종 승인 완료', async () => {
      const res = await authPost(
        app,
        `/api/v1/approvals/${approvalRequestId}/process`,
        finance.accessToken,
      )
        .send({ action: 'approve', comment: '예산 확인 완료' })
        .expect(200);

      expect(res.body.status).toBe('approved');
      expect(res.body.steps[0].status).toBe('approved');
      expect(res.body.steps[1].status).toBe('approved');
    });
  });

  describe('4. 초고액 한도 초과 → 3단계 승인 (부서장 → 재무팀 → 관리자)', () => {
    let approvalRequestId: string;

    it('초과액 60만원 → 3단계 승인 체인 생성', async () => {
      const res = await authPost(app, '/api/v1/approvals', employee.accessToken)
        .send({
          transactionId: '00000000-0000-0000-0000-000000000003',
          trigger: 'limit_exceeded',
          requestedAmount: 800000,
          exceededAmount: 600000,
          reason: '해외 출장 장비 구매',
        })
        .expect(201);

      expect(res.body.totalSteps).toBe(3);
      expect(res.body.steps[0].approverRole).toBe('manager');
      expect(res.body.steps[1].approverRole).toBe('finance');
      expect(res.body.steps[2].approverRole).toBe('admin');

      approvalRequestId = res.body.id;
    });

    it('3단계 순차 승인 완료', async () => {
      // 1단계: Manager
      let res = await authPost(
        app,
        `/api/v1/approvals/${approvalRequestId}/process`,
        manager.accessToken,
      )
        .send({ action: 'approve', comment: '출장 확인' })
        .expect(200);
      expect(res.body.status).toBe('escalated');

      // 2단계: Finance
      res = await authPost(
        app,
        `/api/v1/approvals/${approvalRequestId}/process`,
        finance.accessToken,
      )
        .send({ action: 'approve', comment: '예산 확인' })
        .expect(200);
      expect(res.body.status).toBe('escalated');

      // 3단계: Admin
      res = await authPost(
        app,
        `/api/v1/approvals/${approvalRequestId}/process`,
        admin.accessToken,
      )
        .send({ action: 'approve', comment: '최종 승인' })
        .expect(200);
      expect(res.body.status).toBe('approved');
    });
  });

  describe('5. 승인 거절 시나리오', () => {
    it('부서장이 1단계에서 거절하면 전체 요청이 rejected된다', async () => {
      // 승인 요청 생성
      const createRes = await authPost(app, '/api/v1/approvals', employee.accessToken)
        .send({
          transactionId: '00000000-0000-0000-0000-000000000004',
          trigger: 'limit_exceeded',
          requestedAmount: 200000,
          exceededAmount: 150000,
          reason: '추가 경비 요청',
        })
        .expect(201);

      // 부서장 거절
      const res = await authPost(
        app,
        `/api/v1/approvals/${createRes.body.id}/process`,
        manager.accessToken,
      )
        .send({ action: 'reject', comment: '불필요한 지출로 판단' })
        .expect(200);

      expect(res.body.status).toBe('rejected');
    });
  });

  describe('6. 승인 요청 취소', () => {
    it('직원이 대기 중인 본인의 승인 요청을 취소한다', async () => {
      const createRes = await authPost(app, '/api/v1/approvals', employee.accessToken)
        .send({
          transactionId: '00000000-0000-0000-0000-000000000005',
          trigger: 'limit_exceeded',
          requestedAmount: 100000,
          exceededAmount: 50000,
          reason: '취소 테스트',
        })
        .expect(201);

      const res = await authPost(
        app,
        `/api/v1/approvals/${createRes.body.id}/cancel`,
        employee.accessToken,
      ).expect(200);

      expect(res.body.status).toBe('cancelled');
    });

    it('다른 직원의 승인 요청은 취소할 수 없다 (403)', async () => {
      const createRes = await authPost(app, '/api/v1/approvals', employee.accessToken)
        .send({
          transactionId: '00000000-0000-0000-0000-000000000006',
          trigger: 'limit_exceeded',
          requestedAmount: 100000,
          exceededAmount: 50000,
          reason: '권한 테스트',
        })
        .expect(201);

      // 다른 직원(manager)이 취소 시도
      await authPost(
        app,
        `/api/v1/approvals/${createRes.body.id}/cancel`,
        manager.accessToken,
      ).expect(403);
    });
  });

  describe('7. 거래별 승인 요청 조회', () => {
    it('거래 ID로 관련 승인 요청을 조회한다', async () => {
      const testTransactionId = '00000000-0000-0000-0000-000000000001';

      const res = await authGet(
        app,
        `/api/v1/approvals/transaction/${testTransactionId}`,
        employee.accessToken,
      ).expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
