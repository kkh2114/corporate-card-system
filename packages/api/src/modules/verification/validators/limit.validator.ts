import { Injectable } from '@nestjs/common';
import { VerificationCheckResult } from '../interfaces/verification-result.interface';

@Injectable()
export class LimitValidator {
  validate(
    amount: number,
    perTransactionLimit: number | null,
    dailyUsed: number,
    dailyLimit: number | null,
    monthlyUsed: number,
    monthlyLimit: number,
  ): VerificationCheckResult {
    if (perTransactionLimit && amount > perTransactionLimit) {
      return {
        type: 'limit',
        status: 'fail',
        actualValue: `${amount}`,
        expectedValue: `<= ${perTransactionLimit}`,
        message: `건별 한도 초과 (${amount.toLocaleString()}원 > ${perTransactionLimit.toLocaleString()}원)`,
      };
    }

    if (dailyLimit && dailyUsed + amount > dailyLimit) {
      return {
        type: 'limit',
        status: 'fail',
        actualValue: `${dailyUsed + amount}`,
        expectedValue: `<= ${dailyLimit}`,
        message: `일일 한도 초과 (사용 후 잔여: ${(dailyLimit - dailyUsed - amount).toLocaleString()}원)`,
      };
    }

    if (monthlyUsed + amount > monthlyLimit) {
      return {
        type: 'limit',
        status: 'fail',
        actualValue: `${monthlyUsed + amount}`,
        expectedValue: `<= ${monthlyLimit}`,
        message: `월간 한도 초과 (사용 후 잔여: ${(monthlyLimit - monthlyUsed - amount).toLocaleString()}원)`,
      };
    }

    return {
      type: 'limit',
      status: 'pass',
      message: `한도 내 사용 (일 잔여: ${dailyLimit ? (dailyLimit - dailyUsed - amount).toLocaleString() : 'N/A'}원, 월 잔여: ${(monthlyLimit - monthlyUsed - amount).toLocaleString()}원)`,
    };
  }
}
