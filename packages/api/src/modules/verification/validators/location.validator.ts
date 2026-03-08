import { Injectable } from '@nestjs/common';
import { calculateDistance } from '@/common/utils/haversine.util';
import { VerificationCheckResult } from '../interfaces/verification-result.interface';

const DEFAULT_DISTANCE_THRESHOLD = 500; // meters

@Injectable()
export class LocationValidator {
  validate(
    userLat: number,
    userLon: number,
    receiptLat: number,
    receiptLon: number,
    threshold = DEFAULT_DISTANCE_THRESHOLD,
  ): VerificationCheckResult {
    const distance = calculateDistance(userLat, userLon, receiptLat, receiptLon);

    if (distance <= threshold) {
      return {
        type: 'location',
        status: 'pass',
        actualValue: `${Math.round(distance)}m`,
        expectedValue: `<= ${threshold}m`,
        message: `위치 확인 완료 (거리: ${Math.round(distance)}m)`,
      };
    }

    if (distance <= threshold * 2) {
      return {
        type: 'location',
        status: 'warning',
        actualValue: `${Math.round(distance)}m`,
        expectedValue: `<= ${threshold}m`,
        message: `위치 오차 범위 초과 (거리: ${Math.round(distance)}m). 확인이 필요합니다.`,
      };
    }

    return {
      type: 'location',
      status: 'fail',
      actualValue: `${Math.round(distance)}m`,
      expectedValue: `<= ${threshold}m`,
      message: `위치 불일치 (거리: ${Math.round(distance)}m). 영수증 주소와 현재 위치가 크게 다릅니다.`,
    };
  }
}
