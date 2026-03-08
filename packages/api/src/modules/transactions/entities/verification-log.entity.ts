import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from './transaction.entity';

export enum VerificationType {
  LOCATION = 'location',
  CATEGORY = 'category',
  REGION = 'region',
  LIMIT = 'limit',
}

export enum VerificationResult {
  PASS = 'pass',
  FAIL = 'fail',
  WARNING = 'warning',
}

@Entity('verification_logs')
export class VerificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaction_id', type: 'uuid' })
  transactionId: string;

  @Column({
    name: 'verification_type',
    type: 'enum',
    enum: VerificationType,
  })
  verificationType: VerificationType;

  @Column({
    type: 'enum',
    enum: VerificationResult,
  })
  result: VerificationResult;

  @Column({ name: 'expected_value', type: 'text', nullable: true })
  expectedValue: string;

  @Column({ name: 'actual_value', type: 'text', nullable: true })
  actualValue: string;

  @Column({ name: 'difference_value', type: 'text', nullable: true })
  differenceValue: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'verified_at', type: 'timestamptz' })
  verifiedAt: Date;

  @ManyToOne(() => Transaction, (transaction) => transaction.verificationLogs)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;
}
