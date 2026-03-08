export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ESCALATED = 'escalated',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export type ApprovalStatusType = `${ApprovalStatus}`;

export enum ApprovalStepType {
  MANAGER = 'manager',
  FINANCE = 'finance',
  ADMIN = 'admin',
}

export enum ApprovalTrigger {
  LIMIT_EXCEEDED = 'limit_exceeded',
  RESTRICTED_CATEGORY = 'restricted_category',
  LOCATION_MISMATCH = 'location_mismatch',
  HIGH_AMOUNT = 'high_amount',
  AFTER_HOURS = 'after_hours',
  MANUAL_FLAG = 'manual_flag',
}
