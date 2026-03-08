import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PoliciesService } from '@/modules/policies/policies.service';
import { CardPolicy } from '@/modules/policies/entities/card-policy.entity';

describe('PoliciesService', () => {
  let service: PoliciesService;

  const mockPolicy: Partial<CardPolicy> = {
    id: 'policy-uuid-1',
    employeeId: 'emp-uuid-1',
    monthlyLimit: 2000000,
    dailyLimit: 500000,
    perTransactionLimit: 300000,
    allowedCategories: ['식음료', '교통'],
    allowedRegions: ['서울', '경기'],
    restrictedAreas: ['유흥가'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPolicyRepository = {
    create: jest.fn().mockImplementation((data) => ({ ...data })),
    save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'policy-uuid-1', ...data })),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliciesService,
        { provide: getRepositoryToken(CardPolicy), useValue: mockPolicyRepository },
      ],
    }).compile();

    service = module.get<PoliciesService>(PoliciesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new card policy', async () => {
      const dto = {
        employeeId: 'emp-uuid-1',
        monthlyLimit: 2000000,
        dailyLimit: 500000,
        perTransactionLimit: 300000,
        allowedCategories: ['식음료'],
        allowedRegions: ['서울'],
        restrictedAreas: [],
        validFrom: new Date('2026-01-01'),
      };

      await service.create(dto as any);

      expect(mockPolicyRepository.create).toHaveBeenCalledWith(dto);
      expect(mockPolicyRepository.save).toHaveBeenCalled();
    });
  });

  describe('findByEmployeeId', () => {
    it('should return policy for given employee', async () => {
      mockPolicyRepository.findOne.mockResolvedValue(mockPolicy);

      const result = await service.findByEmployeeId('emp-uuid-1');

      expect(result).toEqual(mockPolicy);
      expect(mockPolicyRepository.findOne).toHaveBeenCalledWith({
        where: { employeeId: 'emp-uuid-1' },
        relations: ['employee'],
      });
    });

    it('should throw NotFoundException when policy not found', async () => {
      mockPolicyRepository.findOne.mockResolvedValue(null);

      await expect(service.findByEmployeeId('nonexist')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return policy by id', async () => {
      mockPolicyRepository.findOne.mockResolvedValue(mockPolicy);

      const result = await service.findOne('policy-uuid-1');

      expect(result).toEqual(mockPolicy);
      expect(mockPolicyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'policy-uuid-1' },
        relations: ['employee'],
      });
    });

    it('should throw NotFoundException when policy not found', async () => {
      mockPolicyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexist')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update existing policy fields', async () => {
      mockPolicyRepository.findOne.mockResolvedValue({ ...mockPolicy });
      const dto = { monthlyLimit: 3000000, dailyLimit: 700000 };

      await service.update('policy-uuid-1', dto as any);

      expect(mockPolicyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          monthlyLimit: 3000000,
          dailyLimit: 700000,
        }),
      );
    });

    it('should throw NotFoundException when policy does not exist', async () => {
      mockPolicyRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexist', {} as any)).rejects.toThrow(NotFoundException);
    });
  });
});
