import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { VerificationLog } from './entities/verification-log.entity';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { PaginatedResult } from '@/common/dto/pagination.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(VerificationLog)
    private readonly verificationLogRepository: Repository<VerificationLog>,
  ) {}

  async findAll(query: GetTransactionsDto): Promise<PaginatedResult<Transaction>> {
    const { page = 1, limit = 20, status, startDate, endDate, employeeId, sortBy, sortOrder } = query;

    const qb = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.employee', 'employee')
      .leftJoinAndSelect('transaction.receipt', 'receipt');

    if (status) {
      qb.andWhere('transaction.status = :status', { status });
    }
    if (startDate) {
      qb.andWhere('transaction.transactionDate >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('transaction.transactionDate <= :endDate', { endDate });
    }
    if (employeeId) {
      qb.andWhere('transaction.employeeId = :employeeId', { employeeId });
    }

    const orderField = sortBy === 'amount' ? 'transaction.amount' : 'transaction.transactionDate';
    qb.orderBy(orderField, (sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC');

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      metadata: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['employee', 'receipt', 'verificationLogs'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction #${id} not found`);
    }
    return transaction;
  }

  async approve(id: string, approvedBy: string, note?: string): Promise<Transaction> {
    const transaction = await this.findOne(id);
    transaction.status = TransactionStatus.APPROVED;
    transaction.processedBy = approvedBy;
    transaction.processedAt = new Date();
    return this.transactionRepository.save(transaction);
  }

  async reject(id: string, rejectedBy: string, reason: string): Promise<Transaction> {
    const transaction = await this.findOne(id);
    transaction.status = TransactionStatus.REJECTED;
    transaction.rejectionReason = reason;
    transaction.processedBy = rejectedBy;
    transaction.processedAt = new Date();
    return this.transactionRepository.save(transaction);
  }

  async createFromReceipt(
    employeeId: string,
    receiptId: string,
    data: Partial<Transaction>,
  ): Promise<Transaction> {
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const transaction = this.transactionRepository.create({
      ...data,
      employeeId,
      receiptId,
      transactionNumber,
      status: TransactionStatus.PENDING,
    });
    return this.transactionRepository.save(transaction);
  }

  async saveVerificationLog(log: Partial<VerificationLog>): Promise<VerificationLog> {
    const entity = this.verificationLogRepository.create(log);
    return this.verificationLogRepository.save(entity);
  }
}
