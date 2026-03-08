import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ESCALATED = 'escalated',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum ApprovalTrigger {
  LIMIT_EXCEEDED = 'limit_exceeded',
  RESTRICTED_CATEGORY = 'restricted_category',
  LOCATION_MISMATCH = 'location_mismatch',
  HIGH_AMOUNT = 'high_amount',
  AFTER_HOURS = 'after_hours',
  MANUAL_FLAG = 'manual_flag',
}

@Entity('approval_requests')
export class ApprovalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaction_id', type: 'uuid' })
  transactionId: string;

  @Column({ name: 'requester_id', type: 'uuid' })
  requesterId: string;

  @Column({ type: 'enum', enum: ApprovalTrigger })
  trigger: ApprovalTrigger;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  status: ApprovalStatus;

  @Column({ name: 'requested_amount', type: 'decimal', precision: 12, scale: 2 })
  requestedAmount: number;

  @Column({ name: 'exceeded_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  exceededAmount: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'current_step', type: 'integer', default: 0 })
  currentStep: number;

  @Column({ name: 'total_steps', type: 'integer', default: 1 })
  totalSteps: number;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'requester_id' })
  requester: Employee;

  @OneToMany(() => ApprovalStep, (step) => step.approvalRequest, { cascade: true })
  steps: ApprovalStep[];
}

@Entity('approval_steps')
export class ApprovalStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'approval_request_id', type: 'uuid' })
  approvalRequestId: string;

  @Column({ name: 'step_order', type: 'integer' })
  stepOrder: number;

  @Column({ name: 'approver_role', type: 'varchar', length: 20 })
  approverRole: string;

  @Column({ name: 'approver_id', type: 'uuid', nullable: true })
  approverId: string;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  status: ApprovalStatus;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ name: 'acted_at', type: 'timestamp', nullable: true })
  actedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ApprovalRequest, (request) => request.steps)
  @JoinColumn({ name: 'approval_request_id' })
  approvalRequest: ApprovalRequest;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'approver_id' })
  approver: Employee;
}
