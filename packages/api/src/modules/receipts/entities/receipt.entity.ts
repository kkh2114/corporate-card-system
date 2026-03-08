import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToOne, JoinColumn,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { OcrResult } from './ocr-result.entity';

export enum ReceiptStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('receipts')
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @Column({ name: 'file_url', type: 'varchar', length: 500 })
  fileUrl: string;

  @Column({ name: 'file_key', type: 'varchar', length: 500 })
  fileKey: string;

  @Column({ name: 'original_filename', type: 'varchar', length: 255 })
  originalFilename: string;

  @Column({ name: 'file_size', type: 'integer' })
  fileSize: number;

  @Column({ name: 'mime_type', type: 'varchar', length: 50 })
  mimeType: string;

  @Column({ type: 'enum', enum: ReceiptStatus, default: ReceiptStatus.UPLOADED })
  status: ReceiptStatus;

  @Column({ name: 'ocr_confidence', type: 'decimal', precision: 5, scale: 2, nullable: true })
  ocrConfidence: number;

  @Column({ name: 'ocr_raw_result', type: 'jsonb', nullable: true })
  ocrRawResult: Record<string, any>;

  @Column({ name: 'merchant_name', type: 'varchar', length: 200, nullable: true })
  merchantName: string;

  @Column({ name: 'business_number', type: 'varchar', length: 20, nullable: true })
  businessNumber: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  vat: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string;

  @Column({ name: 'transaction_date', type: 'timestamp', nullable: true })
  transactionDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  items: Array<{ name: string; quantity: number; price: number }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @OneToOne(() => OcrResult, (ocrResult) => ocrResult.receipt)
  ocrResult: OcrResult;

  @OneToOne(() => Transaction, (transaction) => transaction.receipt)
  transaction: Transaction;
}
