import { dispatchDomainEvent } from '../agent/event-dispatch';
import { FOURTEEN, SEVEN, TEN } from '../constants';
import type { EnvBindings, TaskRow } from '../types';
import { processCompletionGamification } from './gamification';
import { refreshMonthlyChallengeProgress } from './monthly-challenge';
import { getServiceClient } from './supabase';
import { refreshHomeScore, writeTaskCompletedFeed } from './task-events';
import { completeTaskFlow, isHouseholdTask } from './tasks';

interface CompletionInput {
  actorId: string;
  env: EnvBindings;
  photoUrl: string | undefined;
  service: ReturnType<typeof getServiceClient>;
  task: TaskRow;
  wasCatchup: boolean;
}

interface CompletionResult {
  completionId: string;
  newStreak: number;
  task: TaskRow;
  xpAwarded: number;
}

export const completeTaskWithEffects = async (input: CompletionInput): Promise<CompletionResult> => {
  const completed = await completeTaskFlow(input.service, input.task, input.actorId, input.wasCatchup, input.photoUrl);
  await writeTaskCompletedFeed(input.service, {
    actorId: input.actorId,
    completionId: completed.completionId,
    newStreak: completed.newStreak,
    photoUrl: input.photoUrl,
    task: input.task,
    xpAwarded: completed.xpAwarded,
  });
  await processCompletionGamification(
    input.service,
    input.photoUrl === undefined
      ? { householdId: input.task.household_id, newStreak: completed.newStreak, userId: input.actorId }
      : { householdId: input.task.household_id, newStreak: completed.newStreak, photoUrl: input.photoUrl, userId: input.actorId },
    input.env,
  );
  await refreshHomeScore(input.service, input.task.household_id);
  await refreshMonthlyChallengeProgress(input.service, input.task.household_id);
  await maybeBumpFamilyStreak(input.service, input.task);
  await maybeEmitStreakMilestone(input.service, input.actorId, input.task, completed.newStreak);
  await pushTaskCompleted(input.service, input.env, input.task.household_id, input.actorId, input.task.title);
  return completed;
};

const maybeBumpFamilyStreak = async (service: ReturnType<typeof getServiceClient>, task: TaskRow): Promise<void> => {
  if (!(await isHouseholdTask(service, task.list_id))) {
    return;
  }

  const household = await service.from('households').select('family_streak, streak_last_updated').eq('id', task.household_id).single();
  if (household.error !== null || household.data === null) {
    return;
  }
  const today = new Date().toISOString().slice(0, TEN);
  if (household.data.streak_last_updated === today) {
    return;
  }

  await service.from('households').update({ family_streak: household.data.family_streak + 1, streak_last_updated: today }).eq('id', task.household_id);
};

const maybeEmitStreakMilestone = async (
  service: ReturnType<typeof getServiceClient>,
  actorId: string,
  task: TaskRow,
  newStreak: number,
): Promise<void> => {
  if (!(newStreak === SEVEN || newStreak === FOURTEEN) || !(await isHouseholdTask(service, task.list_id))) {
    return;
  }

  const actor = await service.from('users').select('display_name').eq('id', actorId).single();
  if (actor.error !== null || actor.data === null) {
    return;
  }
  await service.from('feed_events').insert({
    actor_id: actorId,
    event_type: 'streak_milestone',
    household_id: task.household_id,
    payload: {
      actor_name: actor.data.display_name,
      streak_count: newStreak,
      task_title: task.title,
    },
    task_id: task.id,
  });
};

const pushTaskCompleted = async (
  service: ReturnType<typeof getServiceClient>,
  env: EnvBindings,
  householdId: string,
  actorId: string,
  taskTitle: string,
): Promise<void> => {
  const [actor, users] = await Promise.all([
    service.from('users').select('display_name').eq('id', actorId).maybeSingle(),
    service.from('users').select('id').eq('household_id', householdId).neq('id', actorId),
  ]);
  if (users.error !== null || users.data === null || users.data.length === 0) {
    return;
  }

  const actorName = actor.data?.display_name ?? 'Someone';
  await dispatchDomainEvent({
    env,
    event: {
      actor_user_id: actorId,
      audience_user_ids: users.data.map((user) => user.id),
      facts: { actor_name: actorName, task_title: taskTitle },
      household_id: householdId,
      type: 'task_completed',
    },
    service,
  });
};
