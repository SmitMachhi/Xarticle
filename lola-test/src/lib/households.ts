import { HTTP_CONFLICT, PLAN_MEMBER_LIMITS, ROLE_ADMIN } from '../constants';
import type { Plan, UserRow } from '../types';
import { toAppError } from './http';

export const getPlanMemberLimit = (plan: Plan): number => {
  return PLAN_MEMBER_LIMITS[plan];
};

export const assertCapacity = (memberCount: number, plan: Plan): void => {
  const limit = getPlanMemberLimit(plan);
  if (memberCount >= limit) {
    throw toAppError('HOUSEHOLD_FULL', 'household is full for this plan', HTTP_CONFLICT);
  }
};

export const countAdmins = (members: UserRow[]): number => {
  return members.filter((member) => member.role === ROLE_ADMIN).length;
};

export const assertCanLeave = (userId: string, members: UserRow[]): void => {
  const adminCount = countAdmins(members);
  const me = members.find((member) => member.id === userId);
  if (me?.role === ROLE_ADMIN && adminCount <= 1) {
    throw toAppError('SOLE_ADMIN', 'promote someone before leaving', HTTP_CONFLICT);
  }
};

export const assertDemotionAllowed = (requesterId: string, targetId: string, nextRole: string, members: UserRow[]): void => {
  if (requesterId !== targetId || nextRole !== 'member') {
    return;
  }
  const adminCount = countAdmins(members);
  if (adminCount <= 1) {
    throw toAppError('SOLE_ADMIN', 'cannot demote sole admin', HTTP_CONFLICT);
  }
};
