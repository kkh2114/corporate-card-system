import { SetMetadata } from '@nestjs/common';

export interface AuditConfig {
  action: string;
  category: 'AUTH' | 'DATA_ACCESS' | 'DATA_CHANGE' | 'SYSTEM' | 'SECURITY';
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  resourceType?: string;
  description?: string;
}

export const AUDIT_KEY = 'audit';
export const Audit = (config: AuditConfig) => SetMetadata(AUDIT_KEY, config);
