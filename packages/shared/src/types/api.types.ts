// ==========================================
// API Response Wrappers
// ==========================================

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  metadata: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ==========================================
// Auth DTOs
// ==========================================

export interface LoginRequest {
  employeeId: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    department: string;
    role: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ==========================================
// Transaction Filter DTOs
// ==========================================

export interface TransactionFilterParams extends PaginationParams {
  status?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  department?: string;
  sortBy?: 'transactionDate' | 'amount';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  minAmount?: number;
  maxAmount?: number;
}

// ==========================================
// Statistics DTOs
// ==========================================

export interface StatisticsParams {
  period?: string;
  startDate?: string;
  endDate?: string;
  department?: string;
}

export interface StatisticsOverview {
  totalAmount: number;
  totalTransactions: number;
  approvalRate: number;
  violationCount: number;
  averageAmount: number;
  comparedToPrevious: {
    amountChange: number;
    transactionChange: number;
  };
}

// ==========================================
// WebSocket Events
// ==========================================

export interface WsTransactionNewEvent {
  transactionId: string;
  employeeName: string;
  department: string;
  merchantName: string;
  amount: number;
  status: string;
  timestamp: string;
}

export interface WsTransactionStatusEvent {
  transactionId: string;
  status: 'approved' | 'rejected' | 'flagged';
  message: string;
  timestamp: string;
}

export interface WsAlertNewEvent {
  id: string;
  type: string;
  message: string;
  severity: string;
  transactionId: string;
  timestamp: string;
}
