export interface VerificationCheckResult {
  type: 'location' | 'category' | 'region' | 'limit' | 'time';
  status: 'pass' | 'fail' | 'warning';
  expectedValue?: string;
  actualValue?: string;
  message: string;
}

export interface FullVerificationResult {
  overallStatus: 'approved' | 'rejected' | 'flagged';
  checks: VerificationCheckResult[];
  message: string;
  rejectionReason?: string;
  approvalRequired: boolean;
  approvalTriggers: string[];
}
