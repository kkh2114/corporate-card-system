export const STATUS_COLORS: Record<string, string> = {
  approved: 'green',
  rejected: 'red',
  flagged: 'orange',
  pending: 'blue',
};

export const STATUS_LABELS: Record<string, string> = {
  approved: '승인',
  rejected: '거절',
  flagged: '주의',
  pending: '대기',
};

export const SEVERITY_COLORS: Record<string, string> = {
  low: 'blue',
  medium: 'orange',
  high: 'red',
};

export const ALERT_TYPE_LABELS: Record<string, string> = {
  high_amount: '고액 거래',
  location_mismatch: '위치 불일치',
  restricted_category: '제한 업종',
  limit_exceeded: '한도 초과',
  after_hours: '근무시간 외',
};

export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
  suspended: '정지',
};

export const VERIFICATION_TYPE_LABELS: Record<string, string> = {
  location: '위치 검증',
  category: '업종 검증',
  region: '지역 검증',
  limit: '한도 검증',
};

export const VERIFICATION_RESULT_LABELS: Record<string, string> = {
  pass: '통과',
  fail: '실패',
  warning: '주의',
};

export const DEFAULT_PAGE_SIZE = 20;
