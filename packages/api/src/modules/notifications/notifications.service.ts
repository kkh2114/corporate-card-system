import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { AuditLog } from './entities/audit-log.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly gateway: NotificationsGateway,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  // --- Notification CRUD ---

  async getByEmployee(employeeId: string, unreadOnly = false): Promise<Notification[]> {
    const where: any = { employeeId };
    if (unreadOnly) {
      where.isRead = false;
    }
    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    await this.notificationRepository.update(id, {
      isRead: true,
      readAt: new Date(),
    });
    return this.notificationRepository.findOne({ where: { id } });
  }

  async markAllAsRead(employeeId: string): Promise<void> {
    await this.notificationRepository.update(
      { employeeId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async getUnreadCount(employeeId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { employeeId, isRead: false },
    });
  }

  // --- Create & Send ---

  async createAndSend(
    employeeId: string,
    type: string,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      employeeId, type, title, message, data,
    });
    const saved = await this.notificationRepository.save(notification);

    // Push via WebSocket
    this.gateway.emitToUser(employeeId, 'notification:new', {
      id: saved.id,
      type, title, message, data,
      createdAt: saved.createdAt.toISOString(),
    });

    return saved;
  }

  // --- WebSocket event emitters ---

  notifyTransactionNew(data: {
    transactionId: string;
    employeeName: string;
    department: string;
    merchantName: string;
    amount: number;
    status: string;
  }) {
    this.gateway.emitTransactionNew({
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  notifyTransactionStatus(
    userId: string,
    data: {
      transactionId: string;
      status: string;
      message: string;
    },
  ) {
    this.gateway.emitTransactionStatus(userId, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  notifyAlert(data: {
    type: string;
    transactionId: string;
    message: string;
    severity: string;
  }) {
    this.gateway.emitAlert({
      id: `alert-${Date.now()}`,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // --- Audit Log ---

  async createAuditLog(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      actorId, action, entityType, entityId,
      oldValues, newValues, ipAddress, userAgent,
    });
    return this.auditLogRepository.save(log);
  }
}
