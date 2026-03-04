import { DAILY, EVERY_N_DAYS, HTTP_BAD_REQUEST, MILLISECONDS_PER_DAY, MONTHLY, ONCE, ONE, SEVEN, TEN, WEEKLY } from '../constants';
import type { RecurrenceType } from '../types';
import { toAppError } from './http';

export interface RecurrenceInput {
  completedAtIso: string;
  intervalDays: number | null;
  recurrenceType: RecurrenceType;
}

export const computeNextDue = (input: RecurrenceInput): string | null => {
  if (input.recurrenceType === ONCE) {
    return null;
  }

  const completed = new Date(input.completedAtIso);
  if (Number.isNaN(completed.getTime())) {
    throw toAppError('INVALID_DATE', 'invalid completion timestamp', HTTP_BAD_REQUEST);
  }

  const daysToAdd = getDaysToAdd(input.recurrenceType, input.intervalDays, completed);
  const nextDue = new Date(completed);
  nextDue.setUTCDate(nextDue.getUTCDate() + daysToAdd);
  return nextDue.toISOString().slice(0, TEN);
};

const getDaysToAdd = (type: RecurrenceType, intervalDays: number | null, completedAt: Date): number => {
  if (type === DAILY) {
    return ONE;
  }
  if (type === WEEKLY) {
    return SEVEN;
  }
  if (type === EVERY_N_DAYS) {
    if (intervalDays === null || intervalDays < ONE) {
      throw toAppError('INVALID_INTERVAL', 'interval_days must be positive', HTTP_BAD_REQUEST);
    }
    return intervalDays;
  }
  if (type === MONTHLY) {
    const monthLater = new Date(completedAt);
    monthLater.setUTCMonth(monthLater.getUTCMonth() + ONE);
    return Math.round((monthLater.getTime() - completedAt.getTime()) / MILLISECONDS_PER_DAY);
  }
  throw toAppError('INVALID_RECURRENCE', 'unsupported recurrence type', HTTP_BAD_REQUEST);
};
