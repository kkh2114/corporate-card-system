import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction, TransactionStatus } from '../transactions/entities/transaction.entity';
import { StatisticsOverviewQueryDto } from './dto/statistics-query.dto';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async getOverview(query: StatisticsOverviewQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const transactions = await this.transactionRepository.find({
      where: {
        transactionDate: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['employee'],
    });

    const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const approvedCount = transactions.filter((t) => t.status === TransactionStatus.APPROVED).length;
    const rejectedCount = transactions.filter((t) => t.status === TransactionStatus.REJECTED).length;

    // By category
    const categoryMap = new Map<string, { amount: number; count: number }>();
    transactions.forEach((t) => {
      const cat = t.category || 'unknown';
      const existing = categoryMap.get(cat) || { amount: 0, count: 0 };
      existing.amount += Number(t.amount);
      existing.count += 1;
      categoryMap.set(cat, existing);
    });

    const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0,
    }));

    // By department
    const deptMap = new Map<string, { amount: number; count: number }>();
    transactions.forEach((t) => {
      const dept = t.employee?.department || 'unknown';
      const existing = deptMap.get(dept) || { amount: 0, count: 0 };
      existing.amount += Number(t.amount);
      existing.count += 1;
      deptMap.set(dept, existing);
    });

    const byDepartment = Array.from(deptMap.entries()).map(([department, data]) => ({
      department,
      amount: data.amount,
      count: data.count,
      budgetUsage: 0,
    }));

    return {
      summary: {
        totalAmount,
        transactionCount: transactions.length,
        approvedCount,
        rejectedCount,
        approvalRate: transactions.length > 0
          ? Math.round((approvedCount / transactions.length) * 100)
          : 0,
      },
      comparison: {
        amountChange: 0,
        countChange: 0,
      },
      byCategory,
      byDepartment,
    };
  }

  private getDateRange(query: StatisticsOverviewQueryDto) {
    const now = new Date();
    let startDate = query.startDate || now.toISOString().split('T')[0];
    let endDate = query.endDate || now.toISOString();

    if (!query.startDate) {
      const start = new Date(now);
      switch (query.period) {
        case 'daily': break;
        case 'weekly': start.setDate(start.getDate() - 7); break;
        case 'monthly': start.setMonth(start.getMonth() - 1); break;
        case 'yearly': start.setFullYear(start.getFullYear() - 1); break;
      }
      startDate = start.toISOString();
    }

    return { startDate, endDate };
  }
}
