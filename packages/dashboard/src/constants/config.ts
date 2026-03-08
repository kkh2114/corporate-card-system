// Re-export shared constants
export {
  STATUS_COLORS,
  STATUS_LABELS,
  SEVERITY_COLORS,
  ALERT_TYPE_LABELS,
  EMPLOYEE_STATUS_LABELS,
  VERIFICATION_TYPE_LABELS,
  VERIFICATION_RESULT_LABELS,
  DEFAULT_PAGE_SIZE,
} from '@corporate-card/shared';

// Dashboard-specific config
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const WS_URL = import.meta.env.VITE_WS_URL || '';
