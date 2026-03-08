import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index('idx_audit_logs_timestamp', ['timestamp'])
@Index('idx_audit_logs_actor', ['actorId', 'timestamp'])
@Index('idx_audit_logs_action', ['action', 'timestamp'])
@Index('idx_audit_logs_category', ['category', 'severity'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'timestamp', type: 'timestamptz' })
  timestamp: Date;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string;

  @Column({ name: 'actor_employee_id', type: 'varchar', length: 20, nullable: true })
  actorEmployeeId: string;

  @Column({ name: 'actor_role', type: 'varchar', length: 20, nullable: true })
  actorRole: string;

  @Column({ name: 'actor_ip', type: 'varchar', length: 45, nullable: true })
  actorIp: string;

  @Column({ name: 'actor_user_agent', type: 'text', nullable: true })
  actorUserAgent: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'varchar', length: 20 })
  category: string;

  @Column({ type: 'varchar', length: 10, default: 'INFO' })
  severity: string;

  @Column({ name: 'resource_type', type: 'varchar', length: 50, nullable: true })
  resourceType: string;

  @Column({ name: 'resource_id', type: 'varchar', length: 100, nullable: true })
  resourceId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'request_method', type: 'varchar', length: 10, nullable: true })
  requestMethod: string;

  @Column({ name: 'request_path', type: 'text', nullable: true })
  requestPath: string;

  @Column({ name: 'request_body', type: 'jsonb', nullable: true })
  requestBody: Record<string, any>;

  @Column({ name: 'old_value', type: 'jsonb', nullable: true })
  oldValue: Record<string, any>;

  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue: Record<string, any>;

  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum: string;
}
