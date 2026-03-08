// Re-export shared API types
export type {
  ApiResponse,
  ApiErrorResponse,
  PaginationParams,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  ChangePasswordRequest,
  StatisticsParams,
  StatisticsOverview,
  WsTransactionNewEvent,
  WsTransactionStatusEvent,
  WsAlertNewEvent,
} from '@corporate-card/shared';

// ==========================================
// Dashboard-specific API types
// Backend uses PaginatedResult<T> with { data, metadata } structure.
// Dashboard maps this to PaginatedResponse for UI consumption.
// ==========================================

/** Paginated response shape used by dashboard components */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Transaction filter params used by the dashboard filter UI */
export interface TransactionFilterParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  status?: string;
  department?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: 'transactionDate' | 'amount';
  sortOrder?: 'asc' | 'desc';
}
