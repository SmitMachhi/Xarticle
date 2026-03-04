import { HTTP_FORBIDDEN, ROLE_ADMIN } from '../constants';
import type { AppContext } from '../types';
import { toAppError } from './http';

export const requireHousehold = (ctx: AppContext): string => {
  const householdId = ctx.get('auth').householdId;
  if (householdId === null) {
    throw toAppError('NO_HOUSEHOLD', 'no household selected', HTTP_FORBIDDEN);
  }
  return householdId;
};

export const requireAdmin = (ctx: AppContext): void => {
  if (ctx.get('auth').role !== ROLE_ADMIN) {
    throw toAppError('ADMIN_REQUIRED', 'admin role required', HTTP_FORBIDDEN);
  }
};
