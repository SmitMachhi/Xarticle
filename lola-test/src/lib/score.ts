import {
  MIN_SCORE,
  ONE_HUNDRED,
  SCORE_LABEL_GOLD,
  SCORE_LABEL_GREAT,
  SCORE_LABEL_TRACK,
  SCORE_WEIGHT_COMPLETION,
  SCORE_WEIGHT_COVERAGE,
  SCORE_WEIGHT_STREAK,
  STREAK_CAP,
} from '../constants';

export interface ScoreBreakdown {
  completion_rate: number;
  coverage: number;
  streak_health: number;
}

export interface ScoreInput {
  activeTaskCount: number;
  completedInWindow: number;
  coveredListCount: number;
  dueTaskCount: number;
  listCount: number;
  streakAverage: number;
}

export interface ScoreResult {
  breakdown: ScoreBreakdown;
  label: string;
  score: number;
}

export const calculateHomeScore = (input: ScoreInput): ScoreResult => {
  const completionRate = ratio(input.completedInWindow, input.dueTaskCount);
  const streakHealth = Math.min(input.streakAverage / STREAK_CAP, 1);
  const coverage = ratio(input.coveredListCount, input.listCount);

  const weighted =
    completionRate * SCORE_WEIGHT_COMPLETION +
    streakHealth * SCORE_WEIGHT_STREAK +
    coverage * SCORE_WEIGHT_COVERAGE;

  const score = Math.max(MIN_SCORE, Math.round(weighted * ONE_HUNDRED));
  return {
    breakdown: {
      completion_rate: completionRate,
      coverage,
      streak_health: streakHealth,
    },
    label: getScoreLabel(score),
    score,
  };
};

const ratio = (top: number, bottom: number): number => {
  if (bottom <= 0 || top <= 0) {
    return 0;
  }
  return Math.min(top / bottom, 1);
};

const getScoreLabel = (score: number): string => {
  if (score < SCORE_LABEL_TRACK) {
    return "let's get back on track";
  }
  if (score < SCORE_LABEL_GREAT) {
    return 'good momentum';
  }
  if (score < SCORE_LABEL_GOLD) {
    return 'looking great';
  }
  return 'gold standard 🏆';
};
