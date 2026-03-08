import { Injectable } from '@nestjs/common';
import { VerificationCheckResult } from '../interfaces/verification-result.interface';

@Injectable()
export class TimeValidator {
  validate(
    transactionDate: Date,
    allowedHoursStart?: number | null,
    allowedHoursEnd?: number | null,
    allowWeekends?: boolean,
  ): VerificationCheckResult {
    const hour = transactionDate.getHours();
    const dayOfWeek = transactionDate.getDay(); // 0=일, 6=토

    // 주말 검사
    if (allowWeekends === false && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return {
        type: 'time',
        status: 'warning',
        actualValue: `${dayOfWeek === 0 ? '일' : '토'}요일 ${hour}시`,
        message: '주말 법인카드 사용입니다. 관리자 확인이 필요합니다.',
      };
    }

    // 시간대 검사
    if (allowedHoursStart != null && allowedHoursEnd != null) {
      let isWithinHours: boolean;

      if (allowedHoursStart <= allowedHoursEnd) {
        isWithinHours = hour >= allowedHoursStart && hour <= allowedHoursEnd;
      } else {
        isWithinHours = hour >= allowedHoursStart || hour <= allowedHoursEnd;
      }

      if (!isWithinHours) {
        return {
          type: 'time',
          status: 'warning',
          actualValue: `${hour}시`,
          expectedValue: `${allowedHoursStart}시~${allowedHoursEnd}시`,
          message: `허용 시간대(${allowedHoursStart}시~${allowedHoursEnd}시) 외 사용입니다. 관리자 확인이 필요합니다.`,
        };
      }
    }

    return {
      type: 'time',
      status: 'pass',
      message: '시간 검증을 통과했습니다.',
    };
  }
}
