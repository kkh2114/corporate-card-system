import { Injectable } from '@nestjs/common';
import { VerificationCheckResult } from '../interfaces/verification-result.interface';

@Injectable()
export class RegionValidator {
  validate(
    transactionAddress: string,
    allowedRegions: string[],
    restrictedAreas: string[],
  ): VerificationCheckResult {
    if (restrictedAreas && restrictedAreas.length > 0) {
      const isRestricted = restrictedAreas.some((area) =>
        transactionAddress?.includes(area),
      );
      if (isRestricted) {
        return {
          type: 'region',
          status: 'fail',
          actualValue: transactionAddress,
          message: '제한 구역에서의 사용입니다.',
        };
      }
    }

    if (!allowedRegions || allowedRegions.length === 0) {
      return {
        type: 'region',
        status: 'pass',
        message: '지역 제한 없음',
      };
    }

    const isAllowed = allowedRegions.some((region) =>
      transactionAddress?.includes(region),
    );

    if (isAllowed) {
      return {
        type: 'region',
        status: 'pass',
        actualValue: transactionAddress,
        message: '허용된 지역입니다.',
      };
    }

    return {
      type: 'region',
      status: 'fail',
      actualValue: transactionAddress,
      expectedValue: allowedRegions.join(', '),
      message: '허용되지 않은 지역에서의 사용입니다.',
    };
  }
}
