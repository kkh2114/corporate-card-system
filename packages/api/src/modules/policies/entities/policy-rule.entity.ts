import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PolicyRuleType {
  CATEGORY_BLOCK = 'category_block',
  REGION_BLOCK = 'region_block',
  TIME_RESTRICTION = 'time_restriction',
  AMOUNT_THRESHOLD = 'amount_threshold',
  APPROVAL_REQUIRED = 'approval_required',
}

export enum PolicyScope {
  GLOBAL = 'global',
  DEPARTMENT = 'department',
  INDIVIDUAL = 'individual',
}

export interface PolicyCondition {
  categories?: string[];
  regions?: string[];
  amountThreshold?: number;
  timeRange?: { start: number; end: number };
  daysOfWeek?: number[];
  maxTransactionsPerDay?: number;
}

export interface PolicyAction {
  type: 'block' | 'flag' | 'require_approval' | 'notify';
  approvalChain?: string[];
  notifyRoles?: string[];
  message?: string;
}

@Entity('policy_rules')
export class PolicyRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'rule_type',
    type: 'enum',
    enum: PolicyRuleType,
  })
  ruleType: PolicyRuleType;

  @Column({
    type: 'enum',
    enum: PolicyScope,
    default: PolicyScope.GLOBAL,
  })
  scope: PolicyScope;

  @Column({ name: 'scope_target', type: 'varchar', length: 100, nullable: true })
  scopeTarget: string;

  @Column({ type: 'jsonb' })
  conditions: PolicyCondition;

  @Column({ type: 'jsonb' })
  action: PolicyAction;

  @Column({ type: 'integer', default: 0 })
  priority: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
