import { MILLISECONDS_PER_DAY, ONE } from '../constants';

export const getNextTaskStreak = (currentStreak: number, dueDate: string | null, completedAtIso: string): number => {
  if (dueDate === null) {
    return currentStreak + ONE;
  }
  const dueAt = Date.parse(`${dueDate}T23:59:59.999Z`);
  const completedAt = Date.parse(completedAtIso);
  const isLate = completedAt > dueAt + MILLISECONDS_PER_DAY;
  return isLate ? 0 : currentStreak + ONE;
};

export const shouldIncrementFamilyStreak = (completionCountToday: number): boolean => {
  return completionCountToday > 0;
};
