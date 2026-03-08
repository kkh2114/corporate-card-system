export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  TRANSACTIONS: '/transactions',
  TRANSACTION_DETAIL: '/transactions/:id',
  EMPLOYEES: '/employees',
  EMPLOYEE_DETAIL: '/employees/:id',
  POLICIES: '/policies',
  POLICY_DETAIL: '/policies/:id',
  POLICY_CREATE: '/policies/new',
  STATISTICS: '/statistics',
  SETTINGS: '/settings',
  SETUP: '/setup',
} as const;

export const SIDEBAR_MENU = [
  { key: ROUTES.DASHBOARD, label: '대시보드', icon: 'DashboardOutlined' },
  { key: ROUTES.TRANSACTIONS, label: '거래 내역', icon: 'SwapOutlined' },
  { key: ROUTES.EMPLOYEES, label: '직원 관리', icon: 'TeamOutlined' },
  { key: ROUTES.POLICIES, label: '정책 관리', icon: 'SafetyOutlined' },
  { key: ROUTES.STATISTICS, label: '통계/리포트', icon: 'BarChartOutlined' },
  { key: ROUTES.SETTINGS, label: '설정', icon: 'SettingOutlined' },
] as const;
