import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TransactionsService } from '@/modules/transactions/transactions.service';
import { Transaction, TransactionStatus } from '@/modules/transactions/entities/transaction.entity';
import { VerificationLog } from '@/modules/transactions/entities/verification-log.entity';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const mockTransaction: Partial<Transaction> = {
    id: 'txn-uuid-1',
    transactionNumber: 'TXN-123456',
    employeeId: 'emp-uuid-1',
    receiptId: 'receipt-uuid-1',
    amount: 50000,
    status: TransactionStatus.PENDING,
    transactionDate: new Date('2026-03-05'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(1),
    getMany: jest.fn().mockResolvedValue([mockTransaction]),
  };

  const mockTransactionRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((data) => ({ ...data })),
    save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'txn-uuid-1', ...data })),
  };

  const mockVerificationLogRepository = {
    create: jest.fn().mockImplementation((data) => ({ ...data })),
    save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'log-uuid-1', ...data })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getRepositoryToken(Transaction), useValue: mockTransactionRepository },
        { provide: getRepositoryToken(VerificationLog), useValue: mockVerificationLogRepository },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    jest.clearAllMocks();

    // Reset default mocks
    mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.getCount.mockResolvedValue(1);
    mockQueryBuilder.getMany.mockResolvedValue([mockTransaction]);
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([mockTransaction]);
      expect(result.metadata.total).toBe(1);
      expect(result.metadata.page).toBe(1);
      expect(result.metadata.limit).toBe(20);
      expect(result.metadata.totalPages).toBe(1);
    });

    it('should apply status filter when provided', async () => {
      await service.findAll({ page: 1, limit: 20, status: TransactionStatus.PENDING });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'transaction.status = :status',
        { status: TransactionStatus.PENDING },
      );
    });

    it('should apply date range filters', async () => {
      const startDate = '2026-03-01';
      const endDate = '2026-03-31';

      await service.findAll({ page: 1, limit: 20, startDate, endDate });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'transaction.transactionDate >= :startDate',
        { startDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'transaction.transactionDate <= :endDate',
        { endDate },
      );
    });

    it('should apply employee filter', async () => {
      await service.findAll({ page: 1, limit: 20, employeeId: 'emp-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'transaction.employeeId = :employeeId',
        { employeeId: 'emp-1' },
      );
    });

    it('should sort by amount when specified', async () => {
      await service.findAll({ page: 1, limit: 20, sortBy: 'amount', sortOrder: 'ASC' });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('transaction.amount', 'ASC');
    });

    it('should default sort by transactionDate DESC', async () => {
      await service.findAll({ page: 1, limit: 20 });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('transaction.transactionDate', 'DESC');
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await service.findOne('txn-uuid-1');

      expect(result).toEqual(mockTransaction);
      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'txn-uuid-1' },
        relations: ['employee', 'receipt', 'verificationLogs'],
      });
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexist')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('should approve a pending transaction', async () => {
      const pendingTxn = { ...mockTransaction, status: TransactionStatus.PENDING };
      mockTransactionRepository.findOne.mockResolvedValue(pendingTxn);

      const result = await service.approve('txn-uuid-1', 'admin-uuid', 'Looks good');

      expect(mockTransactionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TransactionStatus.APPROVED,
          processedBy: 'admin-uuid',
          processedAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException if transaction does not exist', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(service.approve('nonexist', 'admin-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reject', () => {
    it('should reject a transaction with reason', async () => {
      const pendingTxn = { ...mockTransaction, status: TransactionStatus.PENDING };
      mockTransactionRepository.findOne.mockResolvedValue(pendingTxn);

      await service.reject('txn-uuid-1', 'admin-uuid', '부적절한 사용');

      expect(mockTransactionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TransactionStatus.REJECTED,
          rejectionReason: '부적절한 사용',
          processedBy: 'admin-uuid',
        }),
      );
    });
  });

  describe('createFromReceipt', () => {
    it('should create a transaction from receipt data', async () => {
      const data: Partial<Transaction> = {
        amount: 25000,
        merchantName: '스타벅스',
        category: '식비',
        transactionDate: new Date(),
      };

      const result = await service.createFromReceipt('emp-uuid-1', 'receipt-uuid-1', data);

      expect(mockTransactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 'emp-uuid-1',
          receiptId: 'receipt-uuid-1',
          status: TransactionStatus.PENDING,
          transactionNumber: expect.stringContaining('TXN-'),
        }),
      );
      expect(mockTransactionRepository.save).toHaveBeenCalled();
    });
  });

  describe('saveVerificationLog', () => {
    it('should create and save a verification log', async () => {
      const logData = {
        transactionId: 'txn-uuid-1',
        verificationType: 'location',
        result: 'pass',
      };

      await service.saveVerificationLog(logData as any);

      expect(mockVerificationLogRepository.create).toHaveBeenCalledWith(logData);
      expect(mockVerificationLogRepository.save).toHaveBeenCalled();
    });
  });
});
