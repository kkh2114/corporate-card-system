import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Receipt } from './receipt.entity';

@Entity('ocr_results')
export class OcrResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'receipt_id', type: 'uuid' })
  receiptId: string;

  @Column({ name: 'merchant_name', type: 'varchar', length: 200, nullable: true })
  merchantName: string;

  @Column({ name: 'business_number', type: 'varchar', length: 20, nullable: true })
  businessNumber: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  vat: number;

  @Column({ name: 'transaction_date', type: 'timestamptz', nullable: true })
  transactionDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  items: Array<{ name: string; quantity: number; price: number }>;

  @Column({ name: 'raw_text', type: 'text', nullable: true })
  rawText: string;

  @Column({ name: 'confidence_scores', type: 'jsonb', nullable: true })
  confidenceScores: Record<string, number>;

  @Column({ name: 'processing_time', type: 'integer', nullable: true })
  processingTime: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToOne(() => Receipt, (receipt) => receipt.ocrResult)
  @JoinColumn({ name: 'receipt_id' })
  receipt: Receipt;
}
