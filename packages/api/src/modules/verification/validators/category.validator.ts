import { Injectable } from '@nestjs/common';
import { VerificationCheckResult } from '../interfaces/verification-result.interface';

@Injectable()
export class CategoryValidator {
  validate(
    transactionCategory: string,
    allowedCategories: string[],
  ): VerificationCheckResult {
    if (!allowedCategories || allowedCategories.length === 0) {
      return {
        type: 'category',
        status: 'pass',
        message: '업종 제한 없음',
      };
    }

    const isAllowed = allowedCategories.some(
      (cat) => cat.toLowerCase() === transactionCategory?.toLowerCase(),
    );

    if (isAllowed) {
      return {
        type: 'category',
        status: 'pass',
        actualValue: transactionCategory,
        expectedValue: allowedCategories.join(', '),
        message: `허용된 업종입니다: ${transactionCategory}`,
      };
    }

    return {
      type: 'category',
      status: 'fail',
      actualValue: transactionCategory,
      expectedValue: allowedCategories.join(', '),
      message: `허용되지 않은 업종입니다: ${transactionCategory}`,
    };
  }
}
