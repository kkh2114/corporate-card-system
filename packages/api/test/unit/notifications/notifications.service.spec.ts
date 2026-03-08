import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { NotificationsGateway } from '@/modules/notifications/notifications.gateway';
import { Notification } from '@/modules/notifications/entities/notification.entity';
import { AuditLog } from '@/modules/notifications/entities/audit-log.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let gateway: jest.Mocked<Partial<NotificationsGateway>>;

  const mockNotification: Partial<Notification> = {
    id: 'notif-uuid-1',
    employeeId: 'emp-uuid-1',
    type: 'transaction',
    title: '거래 승인',
    message: '거래가 승인되었습니다.',
    isRead: false,
    createdAt: new Date(),
  };

  const mockNotificationRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn().mockImplementation((data) => ({ ...data })),
    save: jest.fn().mockImplementation((data) =>
      Promise.resolve({ id: 'notif-uuid-1', createdAt: new Date(), ...data }),
    ),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockAuditLogRepository = {
    create: jest.fn().mockImplementation((data) => ({ ...data })),
    save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'audit-uuid-1', ...data })),
  };

  beforeEach(async () => {
    gateway = {
      emitToUser: jest.fn(),
      emitToAdmins: jest.fn(),
      emitTransactionNew: jest.fn(),
      emitTransactionStatus: jest.fn(),
      emitAlert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsGateway, useValue: gateway },
        { provide: getRepositoryToken(Notification), useValue: mockNotificationRepository },
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditLogRepository },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  describe('getByEmployee', () => {
    it('should return all notifications for employee', async () => {
      mockNotificationRepository.find.mockResolvedValue([mockNotification]);

      const result = await service.getByEmployee('emp-uuid-1');

      expect(result).toEqual([mockNotification]);
      expect(mockNotificationRepository.find).toHaveBeenCalledWith({
        where: { employeeId: 'emp-uuid-1' },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });

    it('should return only unread notifications when unreadOnly is true', async () => {
      mockNotificationRepository.find.mockResolvedValue([mockNotification]);

      await service.getByEmployee('emp-uuid-1', true);

      expect(mockNotificationRepository.find).toHaveBeenCalledWith({
        where: { employeeId: 'emp-uuid-1', isRead: false },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });
  });

  describe('markAsRead', () => {
    it('should update notification as read and return it', async () => {
      mockNotificationRepository.findOne.mockResolvedValue({
        ...mockNotification,
        isRead: true,
        readAt: new Date(),
      });

      const result = await service.markAsRead('notif-uuid-1');

      expect(mockNotificationRepository.update).toHaveBeenCalledWith('notif-uuid-1', {
        isRead: true,
        readAt: expect.any(Date),
      });
      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should update all unread notifications for employee', async () => {
      await service.markAllAsRead('emp-uuid-1');

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        { employeeId: 'emp-uuid-1', isRead: false },
        { isRead: true, readAt: expect.any(Date) },
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockNotificationRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('emp-uuid-1');

      expect(result).toBe(5);
      expect(mockNotificationRepository.count).toHaveBeenCalledWith({
        where: { employeeId: 'emp-uuid-1', isRead: false },
      });
    });
  });

  describe('createAndSend', () => {
    it('should save notification and push via WebSocket', async () => {
      const result = await service.createAndSend(
        'emp-uuid-1',
        'approval',
        '승인 완료',
        '거래가 승인되었습니다.',
        { transactionId: 'txn-1' },
      );

      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        employeeId: 'emp-uuid-1',
        type: 'approval',
        title: '승인 완료',
        message: '거래가 승인되었습니다.',
        data: { transactionId: 'txn-1' },
      });
      expect(mockNotificationRepository.save).toHaveBeenCalled();
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        'emp-uuid-1',
        'notification:new',
        expect.objectContaining({
          type: 'approval',
          title: '승인 완료',
          message: '거래가 승인되었습니다.',
        }),
      );
    });
  });

  describe('notifyTransactionNew', () => {
    it('should emit transaction:new event to admins', () => {
      const data = {
        transactionId: 'txn-1',
        employeeName: '홍길동',
        department: '개발팀',
        merchantName: '스타벅스',
        amount: 15000,
        status: 'pending',
      };

      service.notifyTransactionNew(data);

      expect(gateway.emitTransactionNew).toHaveBeenCalledWith(
        expect.objectContaining({
          ...data,
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('notifyTransactionStatus', () => {
    it('should emit transaction:status event to specific user', () => {
      const data = {
        transactionId: 'txn-1',
        status: 'approved',
        message: '거래가 승인되었습니다.',
      };

      service.notifyTransactionStatus('emp-uuid-1', data);

      expect(gateway.emitTransactionStatus).toHaveBeenCalledWith(
        'emp-uuid-1',
        expect.objectContaining({
          ...data,
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('notifyAlert', () => {
    it('should emit alert:new event to admin channel', () => {
      const data = {
        type: 'policy_violation',
        transactionId: 'txn-1',
        message: '정책 위반 감지',
        severity: 'high',
      };

      service.notifyAlert(data);

      expect(gateway.emitAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...data,
          id: expect.stringContaining('alert-'),
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('createAuditLog', () => {
    it('should create and save an audit log entry', async () => {
      const result = await service.createAuditLog(
        'admin-uuid-1',
        'APPROVE_TRANSACTION',
        'transaction',
        'txn-uuid-1',
        { status: 'pending' },
        { status: 'approved' },
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(mockAuditLogRepository.create).toHaveBeenCalledWith({
        actorId: 'admin-uuid-1',
        action: 'APPROVE_TRANSACTION',
        entityType: 'transaction',
        entityId: 'txn-uuid-1',
        oldValues: { status: 'pending' },
        newValues: { status: 'approved' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(mockAuditLogRepository.save).toHaveBeenCalled();
    });
  });
});
