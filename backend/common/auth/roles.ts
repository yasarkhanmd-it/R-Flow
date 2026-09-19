import { UserRole } from '../constants/roles';

export const isManager = (role: string): boolean => role === UserRole.MANAGER;
export const isLead = (role: string): boolean => role === UserRole.LEAD;
export const isEmployee = (role: string): boolean => role === UserRole.EMPLOYEE || role === UserRole.USER;

export const hasRole = (role: string, allowedRoles: string[]): boolean => {
  return allowedRoles.includes(role);
};
