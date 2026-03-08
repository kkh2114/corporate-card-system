import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';
import { CardPolicy } from '../../policies/entities/card-policy.entity';
import { Receipt } from '../../receipts/entities/receipt.entity';
import { VerificationLog } from './verification-log.entity';

export enum TransactionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaction_number', type: 'varchar', length: 50, unique: true })
  transactionNumber: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @Column({ name: 'receipt_id', type: 'uuid', nullable: true })
  receiptId: string;

  @Column({ name: 'policy_id', type: 'uuid', nullable: true })
  policyId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  vat: number;

  @Column({ name: 'merchant_name', type: 'varchar', length: 200, nullable: true })
  merchantName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string;

  @Column({ name: 'transaction_date', type: 'timestamptz' })
  transactionDate: Date;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'gps_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  gpsLatitude: number;

  @Column({ name: 'gps_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  gpsLongitude: number;

  @Column({ name: 'gps_accuracy', type: 'decimal', precision: 6, scale: 2, nullable: true })
  gpsAccuracy: number;

  @Column({ name: 'receipt_address', type: 'text', nullable: true })
  receiptAddress: string;

  @Column({ name: 'distance_difference', type: 'decimal', precision: 10, scale: 2, nullable: true })
  distanceDifference: number;

  @Column({ name: 'location_verified', type: 'boolean', nullable: true })
  locationVerified: boolean;

  @Column({ name: 'category_verified', type: 'boolean', nullable: true })
  categoryVerified: boolean;

  @Column({ name: 'region_verified', type: 'boolean', nullable: true })
  regionVerified: boolean;

  @Column({ name: 'limit_verified', type: 'boolean', nullable: true })
  limitVerified: boolean;

  @Column({ name: 'processed_by', type: 'uuid', nullable: true })
  processedBy: string;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Employee, (employee) => employee.transactions)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => CardPolicy)
  @JoinColumn({ name: 'policy_id' })
  policy: CardPolicy;

  @OneToOne(() => Receipt, (receipt) => receipt.transaction)
  @JoinColumn({ name: 'receipt_id' })
  receipt: Receipt;

  @OneToMany(() => VerificationLog, (log) => log.transaction)
  verificationLogs: VerificationLog[];
}
