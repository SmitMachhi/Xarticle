import { MILLISECONDS_PER_DAY, TEN } from '../constants';

export const isoDate = (value: Date = new Date()): string => {
  return value.toISOString().slice(0, TEN);
};

export const startOfDayIso = (value: Date = new Date()): string => {
  const next = new Date(value);
  next.setUTCHours(0, 0, 0, 0);
  return next.toISOString();
};

export const daysAgoIso = (days: number, value: Date = new Date()): string => {
  const next = new Date(value.getTime() - days * MILLISECONDS_PER_DAY);
  next.setUTCHours(0, 0, 0, 0);
  return next.toISOString();
};

export const addDaysToIsoDate = (dateIso: string, days: number): string => {
  const next = new Date(`${dateIso}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return isoDate(next);
};

export const overdueDays = (nextDue: string, today: Date = new Date()): number => {
  const due = Date.parse(`${nextDue}T00:00:00.000Z`);
  const diff = today.getTime() - due;
  if (diff <= 0) {
    return 0;
  }
  return Math.floor(diff / MILLISECONDS_PER_DAY);
};
