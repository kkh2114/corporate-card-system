import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  PolicyEngineService,
  PolicyEvaluationInput,
} from '@/modules/policies/policy-engine.service';
import { PolicyRule, PolicyScope } from '@/modules/policies/entities/policy-rule.entity';

describe('PolicyEngineService', () => {
  let service: PolicyEngineService;

  const baseInput: PolicyEvaluationInput = {
    employeeId: 'emp-uuid-1',
    department: '개발팀',
    category: '식음료',
    region: '서울시 강남구',
    amount: 50000,
    transactionDate: new Date('2026-03-05T14:00:00'), // Thursday 2PM
    dailyTransactionCount: 2,
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockRuleRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyEngineService,
        { provide: getRepositoryToken(PolicyRule), useValue: mockRuleRepository },
      ],
    }).compile();

    service = module.get<PolicyEngineService>(PolicyEngineService);
    jest.clearAllMocks();
    mockRuleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.getMany.mockResolvedValue([]);
  });

  describe('hard-blocked categories', () => {
    it('should block transaction with hard-blocked category (유흥주점)', async () => {
      const result = await service.evaluate({
        ...baseInput,
        category: '유흥주점',
      });

      expect(result.allowed).toBe(false);
      expect(result.blockMessage).toContain('차단된 업종');
      expect(result.blockMessage).toContain('유흥주점');
    });

    it('should block 도박 category', async () => {
      const result = await service.evaluate({
        ...baseInput,
        category: '도박',
      });

      expect(result.allowed).toBe(false);
      expect(result.blockMessage).toContain('도박');
    });

    it('should block 귀금속 category', async () => {
      const result = await service.evaluate({
        ...baseInput,
        category: '귀금속',
      });

      expect(result.allowed).toBe(false);
    });

    it('should not query rules for hard-blocked categories', async () => {
      await service.evaluate({ ...baseInput, category: '사행성오락' });

      expect(mockRuleRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('rule evaluation - block action', () => {
    it('should block when a matching rule has block action', async () => {
      const blockRule: Partial<PolicyRule> = {
        id: 'rule-1',
        name: '야간 차단',
        scope: PolicyScope.GLOBAL,
        conditions: { timeRange: { start: 22, end: 6 } },
        action: { type: 'block', message: '야간 사용 금지' },
        priority: 100,
        isActive: true,
      };
      mockQueryBuilder.getMany.mockResolvedValue([blockRule]);

      const result = await service.evaluate({
        ...baseInput,
        transactionDate: new Date('2026-03-05T23:00:00'), // 11PM
      });

      expect(result.allowed).toBe(false);
      expect(result.matchedRules).toHaveLength(1);
      expect(result.matchedRules[0].action.type).toBe('block');
      expect(result.blockMessage).toBe('야간 사용 금지');
    });

    it('should stop evaluating rules after block is found', async () => {
      const rules: Partial<PolicyRule>[] = [
        {
          id: 'rule-1',
          name: 'block rule',
          conditions: {},
          action: { type: 'block', message: 'blocked' },
          priority: 100,
        },
        {
          id: 'rule-2',
          name: 'flag rule',
          conditions: {},
          action: { type: 'flag' },
          priority: 50,
        },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(rules);

      const result = await service.evaluate(baseInput);

      expect(result.matchedRules).toHaveLength(1);
      expect(result.matchedRules[0].ruleId).toBe('rule-1');
    });
  });

  describe('rule evaluation - require_approval action', () => {
    it('should collect approval chain from matching rules', async () => {
      const approvalRule: Partial<PolicyRule> = {
        id: 'rule-1',
        name: '고액 승인 필요',
        conditions: { amountThreshold: 100000 },
        action: {
          type: 'require_approval',
          approvalChain: ['manager', 'finance'],
        },
        priority: 80,
      };
      mockQueryBuilder.getMany.mockResolvedValue([approvalRule]);

      const result = await service.evaluate({
        ...baseInput,
        amount: 150000,
      });

      expect(result.allowed).toBe(true);
      expect(result.requiredApprovals).toEqual(['manager', 'finance']);
    });

    it('should deduplicate approval roles from multiple rules', async () => {
      const rules: Partial<PolicyRule>[] = [
        {
          id: 'rule-1',
          name: 'rule A',
          conditions: {},
          action: { type: 'require_approval', approvalChain: ['manager'] },
        },
        {
          id: 'rule-2',
          name: 'rule B',
          conditions: {},
          action: { type: 'require_approval', approvalChain: ['manager', 'admin'] },
        },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(rules);

      const result = await service.evaluate(baseInput);

      expect(result.requiredApprovals).toEqual(['manager', 'admin']);
    });
  });

  describe('rule evaluation - flag/notify actions', () => {
    it('should allow transaction for flag action', async () => {
      const flagRule: Partial<PolicyRule> = {
        id: 'rule-1',
        name: 'flag rule',
        conditions: {},
        action: { type: 'flag' },
      };
      mockQueryBuilder.getMany.mockResolvedValue([flagRule]);

      const result = await service.evaluate(baseInput);

      expect(result.allowed).toBe(true);
      expect(result.matchedRules).toHaveLength(1);
    });

    it('should allow transaction for notify action', async () => {
      const notifyRule: Partial<PolicyRule> = {
        id: 'rule-1',
        name: 'notify rule',
        conditions: {},
        action: { type: 'notify', notifyRoles: ['admin'] },
      };
      mockQueryBuilder.getMany.mockResolvedValue([notifyRule]);

      const result = await service.evaluate(baseInput);

      expect(result.allowed).toBe(true);
    });
  });

  describe('condition matching', () => {
    it('should not match when category condition does not match', async () => {
      const rule: Partial<PolicyRule> = {
        id: 'rule-1',
        name: 'category rule',
        conditions: { categories: ['주류'] },
        action: { type: 'block' },
      };
      mockQueryBuilder.getMany.mockResolvedValue([rule]);

      const result = await service.evaluate({
        ...baseInput,
        category: '식음료',
      });

      expect(result.allowed).toBe(true);
      expect(result.matchedRules).toHaveLength(0);
    });

    it('should match when category is in condition list', async () => {
      const rule: Partial<PolicyRule> = {
        id: 'rule-1',
        name: 'category rule',
        conditions: { categories: ['식음료', '주류'] },
        action: { type: 'flag' },
      };
      mockQueryBuilder.getMany.mockResolvedValue([rule]);

      const result = await service.evaluate(baseInput);

      expect(result.matchedRules).toHaveLength(1);
    });

    it('should not match when amount is below threshold', async () => {
      const rule: Partial<PolicyRule> = {
        id: 'rule-1',
        name: 'amount rule',
        conditions: { amountThreshold: 200000 },
        action: { type: 'block' },
      };
      mockQueryBuilder.getMany.mockResolvedValue([rule]);

      const result = await service.evaluate({
        ...baseInput,
        amount: 100000,
      });

      expect(result.allowed).toBe(true);
      expect(result.matchedRules).toHaveLength(0);
    });

    it('should match when amount is at or above threshold', async () => {
      const rule: Partial<PolicyRule> = {
        id: 'rule-1',
        name: 'amount rule',
        conditions: { amountThreshold: 100000 },
        action: { type: 'flag' },
      };
      mockQueryBuilder.getMany.mockResolvedValue([rule]);

      const result = await service.evaluate({
        ...baseInput,
        amount: 100000,
      });

      expect(result.matchedRules).toHaveLength(1);
    });

    it('should match time range condition (normal range)', async () => {
      const rule: Partial<PolicyRule> = {
        id: 'rule-1',
        name: 'lunch rule',
        conditions: { timeRange: { start: 11, end: 14 } },
        action: { type: 'flag' },
      };
      mockQueryBuilder.getMany.mockResolvedValue([rule]);

      const result = await service.evaluate({
        ...baseInput,
        transactionDate: new Date('2026-03-05T12:00:00'),
      });

      expect(result.matchedRules).toHaveLength(1);
    });

    it('should match time range condition (overnight range)', async () => {
      const rule: Partial<PolicyRule> = {
        id: 'rule-1',
        name: 'overnight rule',
        conditions: { timeRange: { start: 22, end: 6 } },
        action: { type: 'block' },
      };
      mockQueryBuilder.getMany.mockResolvedValue([rule]);

      const result = await service.evaluate({
        ...baseInput,
        transactionDate: new Date('2026-03-05T23:00:00'),
      });

      expect(result.allowed).toBe(false);
    });

    it('should match day of week condition', async () => {
      const rule: Partial<PolicyRule> = {
        id: 'rule-1',
        name: 'weekend rule',
        conditions: { daysOfWeek: [0, 6] }, // Sun, Sat
        action: { type: 'flag' },
      };
      mockQueryBuilder.getMany.mockResolvedValue([rule]);

      const result = await service.evaluate({
        ...baseInput,
        transactionDate: new Date('2026-03-07T14:00:00'), // Saturday
      });

      expect(result.matchedRules).toHaveLength(1);
    });

    it('should not match day of week when not in list', async () => {
      const rule: Partial<PolicyRule> = {
        id: 'rule-1',
        name: 'weekend rule',
        conditions: { daysOfWeek: [0, 6] },
        action: { type: 'block' },
      };
      mockQueryBuilder.getMany.mockResolvedValue([rule]);

      const result = await service.evaluate({
        ...baseInput,
        transactionDate: new Date('2026-03-05T14:00:00'), // Thursday
      });

      expect(result.allowed).toBe(true);
      expect(result.matchedRules).toHaveLength(0);
    });

    it('should match maxTransactionsPerDay condition', async () => {
      const rule: Partial<PolicyRule> = {
        id: 'rule-1',
        name: 'daily limit rule',
        conditions: { maxTransactionsPerDay: 3 },
        action: { type: 'require_approval', approvalChain: ['manager'] },
      };
      mockQueryBuilder.getMany.mockResolvedValue([rule]);

      const result = await service.evaluate({
        ...baseInput,
        dailyTransactionCount: 5,
      });

      expect(result.matchedRules).toHaveLength(1);
      expect(result.requiredApprovals).toContain('manager');
    });
  });

  describe('no matching rules', () => {
    it('should allow transaction when no rules match', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.evaluate(baseInput);

      expect(result.allowed).toBe(true);
      expect(result.matchedRules).toHaveLength(0);
      expect(result.requiredApprovals).toHaveLength(0);
      expect(result.blockMessage).toBeUndefined();
    });
  });
});
