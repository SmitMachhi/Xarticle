import { NINETY, TWO } from '../constants';
import type { TaskRow } from '../types';
import { isoDate } from './dates';
import { calculateHomeScore } from './score';
import { computeScoreMetrics } from './score-metrics';
import { getServiceClient, mustData } from './supabase';

interface TaskCompletedInput {
  actorId: string;
  completionId: string;
  newStreak: number;
  photoUrl: string | undefined;
  task: TaskRow;
  xpAwarded: number;
}

export const writeTaskCompletedFeed = async (
  service: ReturnType<typeof getServiceClient>,
  input: TaskCompletedInput,
): Promise<void> => {
  const [actorQuery, listQuery] = await Promise.all([
    service.from('users').select('display_name, avatar_color').eq('id', input.actorId).single(),
    service.from('lists').select('name').eq('id', input.task.list_id).single(),
  ]);

  const actor = mustData(actorQuery.data, actorQuery.error, 'ACTOR_FETCH_FAILED');
  const list = mustData(listQuery.data, listQuery.error, 'LIST_FETCH_FAILED');

  await service.from('feed_events').insert({
    actor_id: input.actorId,
    completion_id: input.completionId,
    event_type: 'task_completed',
    household_id: input.task.household_id,
    payload: {
      actor_avatar_color: actor.avatar_color,
      actor_name: actor.display_name,
      effort_points: input.task.effort_points,
      list_name: list.name,
      new_streak: input.newStreak >= TWO ? input.newStreak : 0,
      photo_url: input.photoUrl,
      task_title: input.task.title,
      xp_awarded: input.xpAwarded,
    },
    task_id: input.task.id,
  });
};

export const refreshHomeScore = async (
  service: ReturnType<typeof getServiceClient>,
  householdId: string,
): Promise<{ label: string; score: number }> => {
  const [household, lists, tasks, completions] = await Promise.all([
    service.from('households').select('score_above_90_since').eq('id', householdId).single(),
    service.from('lists').select('id, list_type').eq('household_id', householdId).eq('is_archived', false),
    service.from('tasks').select('list_id, next_due, streak_count').eq('household_id', householdId).eq('is_archived', false),
    service.from('completions').select('list_id, completed_at').eq('household_id', householdId),
  ]);

  const metrics = computeScoreMetrics(
    mustData(lists.data, lists.error, 'LIST_FETCH_FAILED'),
    mustData(tasks.data, tasks.error, 'TASK_FETCH_FAILED'),
    mustData(completions.data, completions.error, 'COMPLETION_FETCH_FAILED'),
  );

  const score = calculateHomeScore({
    activeTaskCount: metrics.dueInScoreWindow,
    completedInWindow: metrics.completedInScoreWindow,
    coveredListCount: metrics.coveredListCount,
    dueTaskCount: metrics.dueInScoreWindow,
    listCount: metrics.householdListCount,
    streakAverage: metrics.streakAverage,
  });

  const householdRow = mustData(household.data, household.error, 'HOUSEHOLD_FETCH_FAILED');
  const scoreAboveSince = nextScoreAboveNinetySince(householdRow.score_above_90_since, score.score);
  await service
    .from('households')
    .update({ home_score: score.score, score_above_90_since: scoreAboveSince })
    .eq('id', householdId);
  return { label: score.label, score: score.score };
};

const nextScoreAboveNinetySince = (previous: string | null, score: number): string | null => {
  if (score < NINETY) {
    return null;
  }
  return previous ?? isoDate();
};
