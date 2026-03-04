import { ONE_HUNDRED, SCORE_LABEL_GOLD, SCORE_LABEL_GREAT, SCORE_LABEL_TRACK } from '../constants';

interface RenderTask {
  assigned_to: string | null;
  effort_points: number;
  next_due: string | null;
  streak_count: number;
  title: string;
}

export const formatTaskList = (tasks: RenderTask[]): string => {
  if (tasks.length === 0) {
    return 'none';
  }
  return tasks
    .map((task) => `${task.title} (due ${task.next_due ?? 'none'}, effort ${task.effort_points}, streak ${task.streak_count})`)
    .join('; ');
};

export const formatHouseholdTaskList = (tasks: RenderTask[], memberNamesById: Map<string, string>): string => {
  if (tasks.length === 0) {
    return 'none';
  }
  return tasks
    .map((task) => {
      const assignee = task.assigned_to === null ? 'unassigned' : (memberNamesById.get(task.assigned_to) ?? 'unknown');
      return `${task.title} (due ${task.next_due ?? 'none'}, assigned to ${assignee}, effort ${task.effort_points}, streak ${task.streak_count})`;
    })
    .join('; ');
};

export const scoreLabel = (score: number): string => {
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

export const formatChallenge = (value: unknown): string => {
  if (typeof value !== 'object' || value === null) {
    return 'none';
  }
  const challenge = value as { completed?: boolean; current_rate?: number; goal?: string; target_completion_rate?: number };
  const goal = challenge.goal ?? 'no goal set';
  const currentRate = typeof challenge.current_rate === 'number' ? Math.round(challenge.current_rate * ONE_HUNDRED) : 0;
  const targetRate = typeof challenge.target_completion_rate === 'number' ? Math.round(challenge.target_completion_rate * ONE_HUNDRED) : 0;
  const completed = challenge.completed === true ? 'yes' : 'no';
  return `${goal}; progress ${currentRate}%/${targetRate}%; completed ${completed}`;
};
