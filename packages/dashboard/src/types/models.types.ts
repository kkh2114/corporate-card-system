// Re-export shared enums and types as the single source of truth
export {
  Role,
  TransactionStatus,
  EmployeeStatus,
  ApprovalStatus,
  ApprovalTrigger,
  VerificationType,
  VerificationResult as VerificationResultEnum,
  ReceiptStatus,
  PolicyRuleType,
  PolicyScope,
  AlertType,
  AlertSeverity,
  StatisticsPeriod,
} from '@corporate-card/shared';

export type {
  UserRole,
  TransactionStatusType,
  EmployeeStatusType,
  ApprovalStatusType,
  VerificationLogEntry,
  Receipt,
  NotificationItem,
  ApprovalRequest,
  PolicyCondition,
  PolicyAction,
  DashboardSummary,
  DepartmentUsage,
  DailyUsage,
  CategoryBreakdown,
  ViolationSummary,
} from '@corporate-card/shared';

// ==========================================
// Dashboard View Models
// These extend or reshape the backend models for UI consumption.
// The API layer is responsible for mapping backend responses into these shapes.
// ==========================================

/** User info stored in auth store (subset of Employee from login response) */
export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  role: string;
}

/** Employee as displayed in the dashboard tables */
export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: string;
  isActive: boolean;
  cardNumber?: string;
  monthlyLimit: number;
  remainingLimit: number;
  createdAt: string;
  updatedAt: string;
}

/** Transaction as displayed in dashboard (flattened view with joined employee info) */
export interface Transaction {
  id: string;
  transactionNumber?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  merchantName: string;
  merchantCategory: string;
  amount: number;
  vat: number;
  totalAmount: number;
  transactionDate: string;
  status: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  receiptImageUrl?: string;
  verificationResult?: VerificationResult;
  rejectionReason?: string;
  adminNote?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
}

/** Aggregated verification result for UI display */
export interface VerificationResult {
  locationMatch: boolean;
  locationDistance: number;
  categoryAllowed: boolean;
  regionAllowed: boolean;
  withinLimit: boolean;
  overallStatus: string;
  details: string[];
}

/** Policy Rule as managed in the dashboard UI */
export interface PolicyRule {
  type: 'category' | 'region' | 'time' | 'amount' | 'merchant';
  condition: string;
  action: 'allow' | 'deny' | 'flag';
  value: string;
}

/** Card Policy as displayed in the dashboard policy management */
export interface CardPolicy {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  rules: PolicyRule[];
  appliedDepartments: string[];
  createdAt: string;
  updatedAt: string;
}

/** Alert displayed in dashboard */
export interface Alert {
  id: string;
  type: string;
  transactionId: string;
  employeeName: string;
  message: string;
  severity: string;
  isRead: boolean;
  createdAt: string;
}
