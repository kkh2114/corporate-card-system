import { Injectable } from '@nestjs/common';
import { LocationValidator } from './validators/location.validator';
import { CategoryValidator } from './validators/category.validator';
import { RegionValidator } from './validators/region.validator';
import { LimitValidator } from './validators/limit.validator';
import { TimeValidator } from './validators/time.validator';
import { FullVerificationResult, VerificationCheckResult } from './interfaces/verification-result.interface';
import { CardPolicy } from '../policies/entities/card-policy.entity';

export interface VerificationInput {
  amount: number;
  category: string;
  receiptAddress: string;
  userLat: number;
  userLon: number;
  receiptLat: number;
  receiptLon: number;
  dailyUsed: number;
  monthlyUsed: number;
  transactionDate: Date;
  policy: CardPolicy;
  timePolicy?: {
    allowedHoursStart?: number;
    allowedHoursEnd?: number;
    allowWeekends?: boolean;
  };
}

@Injectable()
export class VerificationService {
  constructor(
    private readonly locationValidator: LocationValidator,
    private readonly categoryValidator: CategoryValidator,
    private readonly regionValidator: RegionValidator,
    private readonly limitValidator: LimitValidator,
    private readonly timeValidator: TimeValidator,
  ) {}

  verify(input: VerificationInput): FullVerificationResult {
    const checks: VerificationCheckResult[] = [];

    // 1. Location check
    checks.push(
      this.locationValidator.validate(
        input.userLat, input.userLon,
        input.receiptLat, input.receiptLon,
      ),
    );

    // 2. Category check
    checks.push(
      this.categoryValidator.validate(
        input.category,
        input.policy.allowedCategories,
      ),
    );

    // 3. Region check
    checks.push(
      this.regionValidator.validate(
        input.receiptAddress,
        input.policy.allowedRegions,
        input.policy.restrictedAreas,
      ),
    );

    // 4. Limit check
    checks.push(
      this.limitValidator.validate(
        input.amount,
        input.policy.perTransactionLimit,
        input.dailyUsed,
        input.policy.dailyLimit,
        input.monthlyUsed,
        input.policy.monthlyLimit,
      ),
    );

    // 5. Time check
    if (input.transactionDate) {
      checks.push(
        this.timeValidator.validate(
          input.transactionDate,
          input.timePolicy?.allowedHoursStart,
          input.timePolicy?.allowedHoursEnd,
          input.timePolicy?.allowWeekends,
        ),
      );
    }

    // Determine overall status
    const hasFail = checks.some((c) => c.status === 'fail');
    const hasWarning = checks.some((c) => c.status === 'warning');

    let overallStatus: 'approved' | 'rejected' | 'flagged';
    let message: string;
    let rejectionReason: string | undefined;

    if (hasFail) {
      overallStatus = 'rejected';
      const failedChecks = checks.filter((c) => c.status === 'fail');
      rejectionReason = failedChecks.map((c) => c.message).join('; ');
      message = '검증 실패: ' + rejectionReason;
    } else if (hasWarning) {
      overallStatus = 'flagged';
      message = '검증 경고: 관리자 확인이 필요합니다.';
    } else {
      overallStatus = 'approved';
      message = '모든 검증을 통과했습니다.';
    }

    const approvalTriggers = this.detectApprovalTriggers(checks);
    const approvalRequired = approvalTriggers.length > 0;

    return { overallStatus, checks, message, rejectionReason, approvalRequired, approvalTriggers };
  }

  /**
   * 검증 결과에서 승인 트리거를 감지합니다.
   * - fail: 한도 초과 -> limit_exceeded, 업종 차단 -> restricted_category
   * - warning: 시간 외 사용 -> after_hours, 위치 경고 -> location_mismatch
   */
  private detectApprovalTriggers(checks: VerificationCheckResult[]): string[] {
    const triggers: string[] = [];

    for (const check of checks) {
      if (check.status === 'fail') {
        switch (check.type) {
          case 'limit':
            triggers.push('limit_exceeded');
            break;
          case 'location':
            triggers.push('location_mismatch');
            break;
          case 'category':
            triggers.push('restricted_category');
            break;
        }
      }
      if (check.status === 'warning') {
        switch (check.type) {
          case 'time':
            triggers.push('after_hours');
            break;
          case 'location':
            triggers.push('location_mismatch');
            break;
        }
      }
    }

    return [...new Set(triggers)];
  }
}
