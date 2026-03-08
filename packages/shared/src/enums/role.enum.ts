export enum Role {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  FINANCE = 'finance',
  ADMIN = 'admin',
  AUDITOR = 'auditor',
}

export type UserRole = `${Role}`;

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.EMPLOYEE]: 1,
  [Role.MANAGER]: 2,
  [Role.FINANCE]: 3,
  [Role.ADMIN]: 4,
  [Role.AUDITOR]: 0,
};
