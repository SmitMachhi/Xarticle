import { COVERAGE_WINDOW_DAYS, HOUSEHOLD, SCORE_WINDOW_DAYS, STREAK_CAP } from '../constants';
import { daysAgoIso, startOfDayIso } from './dates';

interface CompletionRow {
  completed_at: string;
  list_id: string;
}

interface ListRow {
  id: string;
  list_type: string;
}

interface TaskRow {
  list_id: string;
  next_due: string | null;
  streak_count: number;
}

export interface ScoreMetrics {
  completedInCoverageWindow: number;
  completedInScoreWindow: number;
  coveredListCount: number;
  dueInScoreWindow: number;
  householdListCount: number;
  streakAverage: number;
}

export const computeScoreMetrics = (
  lists: ListRow[],
  tasks: TaskRow[],
  completions: CompletionRow[],
): ScoreMetrics => {
  const scoreSince = daysAgoIso(SCORE_WINDOW_DAYS - 1);
  const coverageSince = daysAgoIso(COVERAGE_WINDOW_DAYS - 1);
  const todayStart = startOfDayIso();
  const householdListIds = new Set(lists.filter((list) => list.list_type === HOUSEHOLD).map((list) => list.id));
  const householdTasks = tasks.filter((task) => householdListIds.has(task.list_id));
  const householdCompletions = completions.filter((completion) => householdListIds.has(completion.list_id));

  const dueInScoreWindow = householdTasks.filter((task) => {
    if (task.next_due === null) {
      return false;
    }
    const value = `${task.next_due}T00:00:00.000Z`;
    return value >= scoreSince && value < todayStart;
  }).length;

  const completedInScoreWindow = householdCompletions.filter((completion) => completion.completed_at >= scoreSince).length;
  const completedInCoverageWindowRows = householdCompletions.filter((completion) => completion.completed_at >= coverageSince);
  const coveredListCount = new Set(completedInCoverageWindowRows.map((completion) => completion.list_id)).size;

  return {
    completedInCoverageWindow: completedInCoverageWindowRows.length,
    completedInScoreWindow,
    coveredListCount,
    dueInScoreWindow,
    householdListCount: householdListIds.size,
    streakAverage: averageCapped(householdTasks.map((task) => task.streak_count), STREAK_CAP),
  };
};

const averageCapped = (values: number[], cap: number): number => {
  if (values.length === 0) {
    return 0;
  }
  const total = values.reduce((sum, value) => sum + Math.min(value, cap), 0);
  return total / values.length;
};
