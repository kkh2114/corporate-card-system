import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToOne, OneToMany,
} from 'typeorm';
import { CardPolicy } from '../../policies/entities/card-policy.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum EmployeeRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  FINANCE = 'finance',
  ADMIN = 'admin',
  AUDITOR = 'auditor',
}

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id', type: 'varchar', length: 20, unique: true })
  employeeId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  position: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: EmployeeStatus, default: EmployeeStatus.ACTIVE })
  status: EmployeeStatus;

  @Column({ type: 'enum', enum: EmployeeRole, default: EmployeeRole.EMPLOYEE })
  role: EmployeeRole;

  @Column({ name: 'fcm_token', type: 'varchar', length: 255, nullable: true })
  fcmToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => CardPolicy, (policy) => policy.employee)
  cardPolicy: CardPolicy;

  @OneToMany(() => Transaction, (transaction) => transaction.employee)
  transactions: Transaction[];
}
