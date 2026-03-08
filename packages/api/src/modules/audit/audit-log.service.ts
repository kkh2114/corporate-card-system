import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { AuditLog } from './audit-log.entity';

export interface CreateAuditLogDto {
  actorId?: string;
  actorEmployeeId?: string;
  actorRole?: string;
  actorIp?: string;
  actorUserAgent?: string;
  action: string;
  category: string;
  severity?: string;
  resourceType?: string;
  resourceId?: string;
  description?: string;
  requestMethod?: string;
  requestPath?: string;
  requestBody?: Record<string, any>;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  private lastChecksum = '';

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    const checksum = this.generateChecksum(dto);

    const log = this.auditLogRepo.create({
      ...dto,
      severity: dto.severity || 'INFO',
      checksum,
    });

    const saved = await this.auditLogRepo.save(log);
    this.lastChecksum = checksum;

    if (dto.severity === 'CRITICAL') {
      this.logger.warn(
        `CRITICAL AUDIT: ${dto.action} by ${dto.actorEmployeeId || 'unknown'} - ${dto.description}`,
      );
    }

    return saved;
  }

  async findByActor(actorId: string, limit = 50): Promise<AuditLog[]> {
    return this.auditLogRepo.find({
      where: { actorId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async findByCategory(category: string, limit = 50): Promise<AuditLog[]> {
    return this.auditLogRepo.find({
      where: { category },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async findSecurityEvents(limit = 100): Promise<AuditLog[]> {
    return this.auditLogRepo.find({
      where: [
        { category: 'SECURITY' },
        { severity: 'CRITICAL' },
        { severity: 'WARNING' },
      ],
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  private generateChecksum(dto: CreateAuditLogDto): string {
    const data = JSON.stringify({
      timestamp: new Date().toISOString(),
      actorId: dto.actorId,
      action: dto.action,
      resourceId: dto.resourceId,
      previousChecksum: this.lastChecksum,
    });
    return createHash('sha256').update(data).digest('hex');
  }
}
