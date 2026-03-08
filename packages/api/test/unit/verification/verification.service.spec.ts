import { Test, TestingModule } from '@nestjs/testing';
import { VerificationService, VerificationInput } from '@/modules/verification/verification.service';
import { LocationValidator } from '@/modules/verification/validators/location.validator';
import { CategoryValidator } from '@/modules/verification/validators/category.validator';
import { RegionValidator } from '@/modules/verification/validators/region.validator';
import { LimitValidator } from '@/modules/verification/validators/limit.validator';
import { TimeValidator } from '@/modules/verification/validators/time.validator';
import { CardPolicy } from '@/modules/policies/entities/card-policy.entity';

describe('VerificationService', () => {
  let service: VerificationService;
  let locationValidator: LocationValidator;
  let categoryValidator: CategoryValidator;
  let regionValidator: RegionValidator;
  let limitValidator: LimitValidator;
  let timeValidator: TimeValidator;

  const mockPolicy: Partial<CardPolicy> = {
    id: 'policy-1',
    monthlyLimit: 3000000,
    dailyLimit: 500000,
    perTransactionLimit: 200000,
    allowedCategories: ['식비', '교통', '사무용품'],
    allowedRegions: ['서울', '경기'],
    restrictedAreas: ['유흥가'],
  };

  const baseInput: VerificationInput = {
    amount: 50000,
    category: '식비',
    receiptAddress: '서울시 강남구 테헤란로 123',
    userLat: 37.5065,
    userLon: 127.0536,
    receiptLat: 37.5065,
    receiptLon: 127.0536,
    dailyUsed: 100000,
    monthlyUsed: 500000,
    transactionDate: new Date('2026-03-05T14:00:00'), // Wednesday 2PM
    policy: mockPolicy as CardPolicy,
    timePolicy: {
      allowedHoursStart: 9,
      allowedHoursEnd: 18,
      allowWeekends: false,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        LocationValidator,
        CategoryValidator,
        RegionValidator,
        LimitValidator,
        TimeValidator,
      ],
    }).compile();

    service = module.get<VerificationService>(VerificationService);
    locationValidator = module.get<LocationValidator>(LocationValidator);
    categoryValidator = module.get<CategoryValidator>(CategoryValidator);
    regionValidator = module.get<RegionValidator>(RegionValidator);
    limitValidator = module.get<LimitValidator>(LimitValidator);
    timeValidator = module.get<TimeValidator>(TimeValidator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verify - all checks pass', () => {
    it('should return approved when all checks pass', () => {
      const result = service.verify(baseInput);

      expect(result.overallStatus).toBe('approved');
      expect(result.checks).toHaveLength(5);
      expect(result.checks.every((c) => c.status === 'pass')).toBe(true);
      expect(result.message).toBe('모든 검증을 통과했습니다.');
      expect(result.approvalRequired).toBe(false);
      expect(result.approvalTriggers).toEqual([]);
    });
  });

  describe('verify - category fail', () => {
    it('should return rejected when category is not allowed', () => {
      const input: VerificationInput = {
        ...baseInput,
        category: '유흥',
      };

      const result = service.verify(input);

      expect(result.overallStatus).toBe('rejected');
      expect(result.rejectionReason).toContain('허용되지 않은 업종');
      expect(result.approvalRequired).toBe(true);
      expect(result.approvalTriggers).toContain('restricted_category');
    });
  });

  describe('verify - region fail (restricted area)', () => {
    it('should return rejected when address is in restricted area', () => {
      const input: VerificationInput = {
        ...baseInput,
        receiptAddress: '서울시 유흥가 근처',
      };

      const result = service.verify(input);

      expect(result.overallStatus).toBe('rejected');
      expect(result.checks.find((c) => c.type === 'region')?.status).toBe('fail');
    });
  });

  describe('verify - region fail (not allowed region)', () => {
    it('should return rejected when address is not in allowed region', () => {
      const input: VerificationInput = {
        ...baseInput,
        receiptAddress: '부산시 해운대구',
      };

      const result = service.verify(input);

      expect(result.overallStatus).toBe('rejected');
      expect(result.checks.find((c) => c.type === 'region')?.status).toBe('fail');
    });
  });

  describe('verify - limit exceeded', () => {
    it('should return rejected when per-transaction limit exceeded', () => {
      const input: VerificationInput = {
        ...baseInput,
        amount: 300000, // exceeds 200000 per-transaction limit
      };

      const result = service.verify(input);

      expect(result.overallStatus).toBe('rejected');
      expect(result.approvalTriggers).toContain('limit_exceeded');
      expect(result.checks.find((c) => c.type === 'limit')?.status).toBe('fail');
    });

    it('should return rejected when daily limit exceeded', () => {
      const input: VerificationInput = {
        ...baseInput,
        amount: 100000,
        dailyUsed: 450000, // 450000 + 100000 > 500000
      };

      const result = service.verify(input);

      expect(result.overallStatus).toBe('rejected');
      expect(result.approvalTriggers).toContain('limit_exceeded');
    });

    it('should return rejected when monthly limit exceeded', () => {
      const input: VerificationInput = {
        ...baseInput,
        amount: 100000,
        monthlyUsed: 2950000, // 2950000 + 100000 > 3000000
      };

      const result = service.verify(input);

      expect(result.overallStatus).toBe('rejected');
      expect(result.approvalTriggers).toContain('limit_exceeded');
    });
  });

  describe('verify - location warning/fail', () => {
    it('should return flagged when location is in warning range (500m-1000m)', () => {
      // ~750m apart (approx)
      const input: VerificationInput = {
        ...baseInput,
        receiptLat: 37.5130,
        receiptLon: 127.0536,
      };

      const result = service.verify(input);
      const locationCheck = result.checks.find((c) => c.type === 'location');

      expect(locationCheck?.status).toBe('warning');
      expect(result.overallStatus).toBe('flagged');
      expect(result.approvalTriggers).toContain('location_mismatch');
    });

    it('should return rejected when location is too far (>1000m)', () => {
      // ~5km apart
      const input: VerificationInput = {
        ...baseInput,
        receiptLat: 37.5500,
        receiptLon: 127.0536,
      };

      const result = service.verify(input);
      const locationCheck = result.checks.find((c) => c.type === 'location');

      expect(locationCheck?.status).toBe('fail');
      expect(result.overallStatus).toBe('rejected');
      expect(result.approvalTriggers).toContain('location_mismatch');
    });
  });

  describe('verify - time warning', () => {
    it('should return flagged for weekend usage', () => {
      const input: VerificationInput = {
        ...baseInput,
        transactionDate: new Date('2026-03-07T14:00:00'), // Saturday
      };

      const result = service.verify(input);
      const timeCheck = result.checks.find((c) => c.type === 'time');

      expect(timeCheck?.status).toBe('warning');
      expect(result.overallStatus).toBe('flagged');
      expect(result.approvalTriggers).toContain('after_hours');
    });

    it('should return flagged for after-hours usage', () => {
      const input: VerificationInput = {
        ...baseInput,
        transactionDate: new Date('2026-03-05T22:00:00'), // Wednesday 10PM
      };

      const result = service.verify(input);
      const timeCheck = result.checks.find((c) => c.type === 'time');

      expect(timeCheck?.status).toBe('warning');
      expect(result.overallStatus).toBe('flagged');
      expect(result.approvalTriggers).toContain('after_hours');
    });
  });

  describe('verify - multiple failures', () => {
    it('should aggregate multiple rejection reasons', () => {
      const input: VerificationInput = {
        ...baseInput,
        category: '유흥',
        amount: 300000, // exceeds per-transaction limit
      };

      const result = service.verify(input);

      expect(result.overallStatus).toBe('rejected');
      const failedChecks = result.checks.filter((c) => c.status === 'fail');
      expect(failedChecks.length).toBeGreaterThanOrEqual(2);
      expect(result.approvalTriggers).toContain('restricted_category');
      expect(result.approvalTriggers).toContain('limit_exceeded');
    });
  });

  describe('verify - no time policy', () => {
    it('should skip time check when transactionDate is falsy', () => {
      const input: VerificationInput = {
        ...baseInput,
        transactionDate: undefined as any,
        timePolicy: undefined,
      };

      const result = service.verify(input);

      expect(result.checks.find((c) => c.type === 'time')).toBeUndefined();
      expect(result.checks).toHaveLength(4);
    });
  });

  describe('detectApprovalTriggers (via verify)', () => {
    it('should deduplicate triggers', () => {
      // location fail produces location_mismatch only once even if triggered
      const input: VerificationInput = {
        ...baseInput,
        receiptLat: 37.5500,
        receiptLon: 127.0536,
      };

      const result = service.verify(input);
      const locationTriggers = result.approvalTriggers.filter((t) => t === 'location_mismatch');
      expect(locationTriggers).toHaveLength(1);
    });
  });
});
