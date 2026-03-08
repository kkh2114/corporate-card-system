import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToOne, JoinColumn,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('card_policies')
export class CardPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @Column({ name: 'card_number', type: 'varchar', length: 20, nullable: true })
  cardNumber: string;

  @Column({ name: 'monthly_limit', type: 'decimal', precision: 12, scale: 2 })
  monthlyLimit: number;

  @Column({ name: 'daily_limit', type: 'decimal', precision: 12, scale: 2, nullable: true })
  dailyLimit: number;

  @Column({ name: 'per_transaction_limit', type: 'decimal', precision: 12, scale: 2, nullable: true })
  perTransactionLimit: number;

  @Column({ name: 'allowed_categories', type: 'text', array: true, default: '{}' })
  allowedCategories: string[];

  @Column({ name: 'allowed_regions', type: 'text', array: true, default: '{}' })
  allowedRegions: string[];

  @Column({ name: 'restricted_areas', type: 'text', array: true, default: '{}' })
  restrictedAreas: string[];

  @Column({ name: 'valid_from', type: 'date' })
  validFrom: Date;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Employee, (employee) => employee.cardPolicy)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}
