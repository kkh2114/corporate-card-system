export enum PolicyRuleType {
  CATEGORY_BLOCK = 'category_block',
  REGION_BLOCK = 'region_block',
  TIME_RESTRICTION = 'time_restriction',
  AMOUNT_THRESHOLD = 'amount_threshold',
  APPROVAL_REQUIRED = 'approval_required',
}

export enum PolicyScope {
  GLOBAL = 'global',
  DEPARTMENT = 'department',
  INDIVIDUAL = 'individual',
}

export enum StatisticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}
