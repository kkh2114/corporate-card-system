import type {
  EmployeeStatusType,
  UserRole,
  TransactionStatusType,
  AlertSeverity,
  AlertType,
  VerificationType,
  VerificationResult,
  PolicyRuleType,
  PolicyScope,
  ReceiptStatus,
  ApprovalStatusType,
  ApprovalStepType,
  ApprovalTrigger,
} from '../enums';

// ==========================================
// Employee
// ==========================================

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  status: EmployeeStatusType;
  role: UserRole;
  fcmToken?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeWithCard extends Employee {
  cardPolicy?: CardPolicy | null;
}

// ==========================================
// Transaction
// ==========================================

export interface Transaction {
  id: string;
  transactionNumber: string;
  employeeId: string;
  receiptId: string | null;
  policyId: string | null;
  amount: number;
  vat: number | null;
  merchantName: string | null;
  category: string | null;
  transactionDate: string;
  status: TransactionStatusType;
  rejectionReason: string | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  gpsAccuracy: number | null;
  receiptAddress: string | null;
  distanceDifference: number | null;
  locationVerified: boolean | null;
  categoryVerified: boolean | null;
  regionVerified: boolean | null;
  limitVerified: boolean | null;
  processedBy: string | null;
  processedAt: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined relations (optional, populated on detail views)
  employee?: Employee;
  verificationLogs?: VerificationLogEntry[];
}

// ==========================================
// Verification
// ==========================================

export interface VerificationLogEntry {
  id: string;
  transactionId: string;
  verificationType: VerificationType;
  result: VerificationResult;
  expectedValue: string | null;
  actualValue: string | null;
  differenceValue: string | null;
  reason: string | null;
  verifiedAt: string;
}

// ==========================================
// Card Policy (per-employee limits)
// ==========================================

export interface CardPolicy {
  id: string;
  employeeId: string;
  cardNumber: string | null;
  monthlyLimit: number;
  dailyLimit: number | null;
  perTransactionLimit: number | null;
  allowedCategories: string[];
  allowedRegions: string[];
  restrictedAreas: string[];
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Policy Rule (global/department/individual rules)
// ==========================================

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

export interface PolicyRule {
  id: string;
  name: string;
  description: string | null;
  ruleType: PolicyRuleType;
  scope: PolicyScope;
  scopeTarget: string | null;
  conditions: PolicyCondition;
  action: PolicyAction;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Receipt
// ==========================================

export interface Receipt {
  id: string;
  employeeId: string;
  fileUrl: string;
  fileKey: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  status: ReceiptStatus;
  ocrConfidence: number | null;
  merchantName: string | null;
  businessNumber: string | null;
  address: string | null;
  amount: number | null;
  vat: number | null;
  category: string | null;
  transactionDate: string | null;
  items: Array<{ name: string; quantity: number; price: number }> | null;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Alert / Notification
// ==========================================

export interface Alert {
  id: string;
  type: AlertType;
  transactionId: string;
  employeeName: string;
  message: string;
  severity: AlertSeverity;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  employeeId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// ==========================================
// Approval
// ==========================================

export interface ApprovalRequest {
  id: string;
  transactionId: string;
  requesterId: string;
  status: ApprovalStatusType;
  trigger: ApprovalTrigger;
  currentStep: ApprovalStepType;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Dashboard / Statistics View Models
// ==========================================

export interface DashboardSummary {
  todaySummary: {
    totalAmount: number;
    transactionCount: number;
    approvedCount: number;
    rejectedCount: number;
    flaggedCount: number;
  };
  monthSummary: {
    totalAmount: number;
    budgetUsage: number;
    remainingBudget: number;
  };
  recentTransactions: Transaction[];
  activeAlerts: Alert[];
}

export interface DepartmentUsage {
  department: string;
  totalAmount: number;
  budgetLimit: number;
  usagePercent: number;
  transactionCount: number;
}

export interface DailyUsage {
  date: string;
  amount: number;
  count: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface ViolationSummary {
  type: string;
  label: string;
  count: number;
}
