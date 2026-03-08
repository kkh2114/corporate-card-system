import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Transaction, TransactionStatus } from '../transactions/entities/transaction.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async getRealtime() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's summary
    const todayTransactions = await this.transactionRepository.find({
      where: { transactionDate: MoreThanOrEqual(today) },
    });

    const todaySummary = {
      totalAmount: todayTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
      transactionCount: todayTransactions.length,
      approvedCount: todayTransactions.filter((t) => t.status === TransactionStatus.APPROVED).length,
      rejectedCount: todayTransactions.filter((t) => t.status === TransactionStatus.REJECTED).length,
      flaggedCount: todayTransactions.filter((t) => t.status === TransactionStatus.FLAGGED).length,
    };

    // Month summary
    const monthTransactions = await this.transactionRepository.find({
      where: { transactionDate: MoreThanOrEqual(monthStart) },
    });

    const monthSummary = {
      totalAmount: monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
      budgetUsage: 0,
      remainingBudget: 0,
    };

    // Recent transactions
    const recentTransactions = await this.transactionRepository.find({
      relations: ['employee'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      todaySummary,
      monthSummary,
      recentTransactions,
      activeAlerts: [] as any[],
    };
  }
}
