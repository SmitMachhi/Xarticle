import type { SupabaseClient } from '@supabase/supabase-js';

import { HOUSEHOLD, HTTP_BAD_REQUEST, HTTP_CONFLICT, HTTP_FORBIDDEN, HTTP_NOT_FOUND, ONCE, ROLE_ADMIN } from '../constants';
import type { TaskRow } from '../types';
import { toAppError } from './http';
import { computeNextDue } from './recurrence';
import { getNextTaskStreak } from './streak';
import { calculateRingProgress, calculateXp } from './xp';

export const assertAssignable = (role: string, actorId: string, assignedTo: string | null | undefined): void => {
  if (assignedTo === undefined || assignedTo === null) {
    return;
  }
  if (role === ROLE_ADMIN) {
    return;
  }
  if (assignedTo !== actorId) {
    throw toAppError('ASSIGNMENT_FORBIDDEN', 'members can only self-assign', HTTP_FORBIDDEN);
  }
};

export const assertTaskEditAllowed = (role: string, actorId: string, task: TaskRow): void => {
  if (role === ROLE_ADMIN) {
    return;
  }
  if (task.assigned_to !== actorId) {
    throw toAppError('TASK_EDIT_FORBIDDEN', 'members can only edit assigned tasks', HTTP_FORBIDDEN);
  }
};

export const completeTaskFlow = async (
  service: SupabaseClient,
  task: TaskRow,
  userId: string,
  wasCatchup: boolean,
  photoUrl?: string,
): Promise<{ completionId: string; newStreak: number; task: TaskRow; xpAwarded: number }> => {
  const completedAtIso = new Date().toISOString();
  const nextDue = computeNextDue({
    completedAtIso,
    intervalDays: task.interval_days,
    recurrenceType: task.recurrence_type,
  });
  const newStreak = getNextTaskStreak(task.streak_count, task.next_due, completedAtIso);
  const xp = calculateXp(task.effort_points, newStreak);
  const updateTask = await updateTaskAfterCompletion(service, task, completedAtIso, nextDue, newStreak);
  const completion = await insertCompletion(service, task, userId, xp.totalXp, wasCatchup, photoUrl);

  await bumpUserXpAndRing(service, userId, xp.totalXp, xp.ringGain);
  return {
    completionId: completion.data.id,
    newStreak,
    task: updateTask.data as TaskRow,
    xpAwarded: xp.totalXp,
  };
};

export const claimTaskFlow = async (service: SupabaseClient, taskId: string, userId: string, householdId: string): Promise<TaskRow> => {
  const claimed = await service
    .from('tasks')
    .update({ assigned_to: userId, is_up_for_grabs: false })
    .eq('id', taskId)
    .eq('household_id', householdId)
    .eq('is_up_for_grabs', true)
    .is('assigned_to', null)
    .select('*')
    .maybeSingle();

  if (claimed.error !== null) {
    throw toAppError('TASK_CLAIM_FAILED', claimed.error.message, HTTP_BAD_REQUEST);
  }
  if (claimed.data !== null) {
    return claimed.data as TaskRow;
  }

  const existing = await service.from('tasks').select('assigned_to').eq('id', taskId).eq('household_id', householdId).maybeSingle();
  if (existing.error !== null) {
    throw toAppError('TASK_CLAIM_LOOKUP_FAILED', existing.error.message, HTTP_BAD_REQUEST);
  }
  if (existing.data === null) {
    throw toAppError('TASK_NOT_FOUND', 'task not found', HTTP_NOT_FOUND);
  }

  const claimedByName = await getClaimedByName(service, existing.data.assigned_to);
  throw toAppError('ALREADY_CLAIMED', claimedByName, HTTP_CONFLICT);
};

const updateTaskAfterCompletion = async (
  service: SupabaseClient,
  task: TaskRow,
  completedAtIso: string,
  nextDue: string | null,
  newStreak: number,
) => {
  const updateTask = await service
    .from('tasks')
    .update({
      is_archived: task.recurrence_type === ONCE,
      last_completed_at: completedAtIso,
      next_due: nextDue,
      streak_count: newStreak,
    })
    .eq('id', task.id)
    .select('*')
    .single();

  if (updateTask.error !== null || updateTask.data === null) {
    throw toAppError('TASK_COMPLETE_FAILED', updateTask.error?.message ?? 'task update failed', HTTP_BAD_REQUEST);
  }
  return updateTask;
};

const insertCompletion = async (
  service: SupabaseClient,
  task: TaskRow,
  userId: string,
  totalXp: number,
  wasCatchup: boolean,
  photoUrl?: string,
) => {
  const completion = await service
    .from('completions')
    .insert({
      completed_by: userId,
      effort_points: task.effort_points,
      household_id: task.household_id,
      list_id: task.list_id,
      photo_url: photoUrl,
      task_id: task.id,
      was_catchup: wasCatchup,
      xp_awarded: totalXp,
    })
    .select('id')
    .single();

  if (completion.error !== null || completion.data === null) {
    throw toAppError('COMPLETION_CREATE_FAILED', completion.error?.message ?? 'completion failed', HTTP_BAD_REQUEST);
  }
  return completion;
};

export const isHouseholdTask = async (service: SupabaseClient, listId: string): Promise<boolean> => {
  const list = await service.from('lists').select('list_type').eq('id', listId).maybeSingle();
  if (list.error !== null || list.data === null) {
    throw toAppError('LIST_LOOKUP_FAILED', list.error?.message ?? 'list not found', HTTP_BAD_REQUEST);
  }
  return list.data.list_type === HOUSEHOLD;
};

const bumpUserXpAndRing = async (service: SupabaseClient, userId: string, xpGain: number, ringGain: number): Promise<void> => {
  const current = await service.from('users').select('ring_progress, xp_total').eq('id', userId).single();
  if (current.error !== null || current.data === null) {
    throw toAppError('USER_LOOKUP_FAILED', current.error?.message ?? 'user not found', HTTP_BAD_REQUEST);
  }

  const nextRing = calculateRingProgress(current.data.ring_progress, ringGain);
  const updateResult = await service
    .from('users')
    .update({ ring_progress: nextRing, xp_total: current.data.xp_total + xpGain })
    .eq('id', userId);

  if (updateResult.error !== null) {
    throw toAppError('USER_XP_UPDATE_FAILED', updateResult.error.message, HTTP_BAD_REQUEST);
  }
};

const getClaimedByName = async (service: SupabaseClient, userId: string | null): Promise<string> => {
  if (userId === null) {
    return 'another member';
  }
  const user = await service.from('users').select('display_name').eq('id', userId).maybeSingle();
  if (user.error !== null || user.data === null) {
    return 'another member';
  }
  return user.data.display_name;
};
