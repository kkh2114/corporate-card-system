import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyRule, PolicyScope, PolicyAction } from './entities/policy-rule.entity';

export interface PolicyEvaluationInput {
  employeeId: string;
  department: string;
  category: string;
  region: string;
  amount: number;
  transactionDate: Date;
  dailyTransactionCount: number;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  matchedRules: MatchedRule[];
  requiredApprovals: string[];
  blockMessage?: string;
}

export interface MatchedRule {
  ruleId: string;
  ruleName: string;
  action: PolicyAction;
}

@Injectable()
export class PolicyEngineService {
  // 전사 차단 업종 (하드코딩, 오버라이드 불가)
  private readonly HARD_BLOCKED_CATEGORIES = [
    '유흥주점',
    '도박',
    '사행성오락',
    '성인용품',
    '귀금속',
  ];

  constructor(
    @InjectRepository(PolicyRule)
    private readonly ruleRepository: Repository<PolicyRule>,
  ) {}

  async evaluate(input: PolicyEvaluationInput): Promise<PolicyEvaluationResult> {
    // 1. 하드코딩 차단 업종 먼저 검사
    if (this.HARD_BLOCKED_CATEGORIES.includes(input.category)) {
      return {
        allowed: false,
        matchedRules: [],
        requiredApprovals: [],
        blockMessage: `차단된 업종입니다: ${input.category}. 이 거래는 관리자에게 보고됩니다.`,
      };
    }

    // 2. 적용 가능한 정책 규칙 조회 (우선순위 내림차순)
    const rules = await this.getApplicableRules(input.employeeId, input.department);

    // 3. 각 규칙 평가
    const matchedRules: MatchedRule[] = [];
    const requiredApprovals: string[] = [];
    let blocked = false;
    let blockMessage: string | undefined;

    for (const rule of rules) {
      if (this.matchesConditions(rule, input)) {
        matchedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          action: rule.action,
        });

        switch (rule.action.type) {
          case 'block':
            blocked = true;
            blockMessage = rule.action.message || `정책 위반: ${rule.name}`;
            break;
          case 'require_approval':
            if (rule.action.approvalChain) {
              for (const role of rule.action.approvalChain) {
                if (!requiredApprovals.includes(role)) {
                  requiredApprovals.push(role);
                }
              }
            }
            break;
          case 'flag':
          case 'notify':
            // flag와 notify는 거래를 차단하지 않음
            break;
        }

        // block이 발견되면 추가 규칙 평가 불필요
        if (blocked) break;
      }
    }

    return {
      allowed: !blocked,
      matchedRules,
      requiredApprovals,
      blockMessage,
    };
  }

  private async getApplicableRules(
    employeeId: string,
    department: string,
  ): Promise<PolicyRule[]> {
    return this.ruleRepository
      .createQueryBuilder('rule')
      .where('rule.is_active = :active', { active: true })
      .andWhere(
        '(rule.scope = :global OR (rule.scope = :dept AND rule.scope_target = :department) OR (rule.scope = :individual AND rule.scope_target = :employeeId))',
        {
          global: PolicyScope.GLOBAL,
          dept: PolicyScope.DEPARTMENT,
          department,
          individual: PolicyScope.INDIVIDUAL,
          employeeId,
        },
      )
      .orderBy('rule.priority', 'DESC')
      .getMany();
  }

  private matchesConditions(rule: PolicyRule, input: PolicyEvaluationInput): boolean {
    const conditions = rule.conditions;

    // 업종 조건
    if (conditions.categories && conditions.categories.length > 0) {
      const categoryMatch = conditions.categories.some(
        (cat) => input.category.includes(cat) || cat.includes(input.category),
      );
      if (!categoryMatch) return false;
    }

    // 지역 조건
    if (conditions.regions && conditions.regions.length > 0) {
      const regionMatch = conditions.regions.some((region) =>
        input.region.includes(region),
      );
      if (!regionMatch) return false;
    }

    // 금액 임계값
    if (conditions.amountThreshold != null) {
      if (input.amount < conditions.amountThreshold) return false;
    }

    // 시간대 조건
    if (conditions.timeRange) {
      const hour = input.transactionDate.getHours();
      const { start, end } = conditions.timeRange;

      let isInRange: boolean;
      if (start <= end) {
        isInRange = hour >= start && hour <= end;
      } else {
        isInRange = hour >= start || hour <= end;
      }

      if (!isInRange) return false;
    }

    // 요일 조건
    if (conditions.daysOfWeek && conditions.daysOfWeek.length > 0) {
      const dayOfWeek = input.transactionDate.getDay();
      if (!conditions.daysOfWeek.includes(dayOfWeek)) return false;
    }

    // 일일 거래 건수 조건
    if (conditions.maxTransactionsPerDay != null) {
      if (input.dailyTransactionCount < conditions.maxTransactionsPerDay) return false;
    }

    return true;
  }
}
