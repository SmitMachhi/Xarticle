import { FIVE, FOURTEEN, ONE_HUNDRED, RING_DIVISOR, RING_GAIN_CAP, SEVEN, TEN, THREE, TWENTY } from '../constants';

export interface XpResult {
  ringGain: number;
  streakBonus: number;
  totalXp: number;
}

export const calculateXp = (effortPoints: number, streakCount: number): XpResult => {
  const streakBonus = getStreakBonus(streakCount);
  const totalXp = effortPoints * TEN + streakBonus;
  const ringGain = Math.min(totalXp / RING_DIVISOR, RING_GAIN_CAP);
  return {
    ringGain,
    streakBonus,
    totalXp,
  };
};

export const calculateRingProgress = (current: number, gain: number): number => {
  return Math.min(Math.round(current + gain), ONE_HUNDRED);
};

const getStreakBonus = (streakCount: number): number => {
  if (streakCount < THREE) {
    return 0;
  }
  if (streakCount < SEVEN) {
    return FIVE;
  }
  if (streakCount < FOURTEEN) {
    return TEN;
  }
  return TWENTY;
};
