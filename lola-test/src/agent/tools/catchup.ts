import { z } from 'zod';

import { FOURTEEN, SEVEN } from '../../constants';
import { addDaysToIsoDate, isoDate, overdueDays } from '../../lib/dates';
import { awardBadgeIfMissing } from '../../lib/gamification';
import { runOpenRouterJson } from '../../lib/openrouter';
import { mustData } from '../../lib/supabase';
import { CATCHUP_PROMPT } from '../prompts/catchup';
import type { ToolDefinition } from './shared';
import { getToolService, requireAdminRole } from './shared';

const modeSchema = z.object({ mode: z.enum(['clear', 'triage']) });
const aiDecisionSchema = z.array(
  z.object({
    bucket: z.enum(['CRITICAL', 'FLEXIBLE', 'SKIP']),
    reason: z.string(),
    task_id: z.string(),
  }),
);

const CRITICAL_CATEGORIES = new Set(['hygiene', 'kitchen']);
const SKIP_CATEGORIES = new Set(['errands', 'personal']);

export const catchupTools: Record<string, ToolDefinition> = {
  trigger_catchup: {
    description: 'run catch-up mode',
    execute: async (context, args) => {
      requireAdminRole(context.role);
      const parsed = modeSchema.parse(args);
      const service = getToolService(context);
      const overdue = await fetchOverdueHouseholdTasks(service, context.householdId);
      const result = parsed.mode === 'clear' ? await clearMode(service, overdue) : await triageMode(context.env, service, overdue);
      const actor = await service.from('users').select('display_name').eq('id', context.userId).single();
      const actorName = mustData(actor.data, actor.error, 'ACTOR_FETCH_FAILED').display_name;

      await service.from('catchup_sessions').insert({
        ai_decisions: result.decisions,
        household_id: context.householdId,
        mode: parsed.mode,
        tasks_critical: result.critical,
        tasks_flexible: result.flexible,
        tasks_skipped: result.skipped,
        triggered_by: context.userId,
      });
      await service.from('households').update({ catchup_pending: false }).eq('id', context.householdId);
      await service.from('feed_events').insert({
        actor_id: context.userId,
        event_type: 'catchup_completed',
        household_id: context.householdId,
        payload: { actor_name: actorName, mode: parsed.mode, tasks_archived: result.skipped, tasks_reset: result.critical + result.flexible },
      });
      await awardBadgeIfMissing(service, context.householdId, context.userId, 'comeback_kid', context.env);
      return result;
    },
    schema: { type: 'object', properties: { mode: { type: 'string' } }, required: ['mode'] },
  },
};

const fetchOverdueHouseholdTasks = async (service: ReturnType<typeof getToolService>, householdId: string) => {
  const today = isoDate();
  const householdLists = await service.from('lists').select('id').eq('household_id', householdId).eq('list_type', 'household');
  const ids = mustData(householdLists.data, householdLists.error, 'LIST_FETCH_FAILED').map((row) => row.id);
  if (ids.length === 0) {
    return [];
  }

  const tasks = await service
    .from('tasks')
    .select('id, category, effort_points, interval_days, next_due')
    .eq('household_id', householdId)
    .eq('is_archived', false)
    .in('list_id', ids)
    .lt('next_due', today);
  return mustData(tasks.data, tasks.error, 'TASK_FETCH_FAILED');
};

const clearMode = async (service: ReturnType<typeof getToolService>, tasks: Array<{ id: string }>) => {
  if (tasks.length > 0) {
    await service.from('tasks').update({ is_archived: true }).in('id', tasks.map((task) => task.id));
  }
  return { critical: 0, decisions: [], flexible: 0, skipped: tasks.length };
};

const triageMode = async (
  env: Parameters<typeof runOpenRouterJson>[0],
  service: ReturnType<typeof getToolService>,
  tasks: Array<{ category: string; effort_points: number; id: string; interval_days: number | null; next_due: string | null }>,
) => {
  const today = isoDate();
  const decisions = await classifyWithAi(env, tasks);
  const criticalIds = decisions.filter((item) => item.bucket === 'CRITICAL').map((item) => item.task_id);
  const flexible = decisions.filter((item) => item.bucket === 'FLEXIBLE');
  const skipIds = decisions.filter((item) => item.bucket === 'SKIP').map((item) => item.task_id);

  if (criticalIds.length > 0) {
    await service.from('tasks').update({ next_due: today }).in('id', criticalIds);
  }

  for (const item of flexible) {
    const task = tasks.find((value) => value.id === item.task_id);
    if (task === undefined) {
      continue;
    }
    const interval = task.interval_days ?? SEVEN;
    await service.from('tasks').update({ next_due: addDaysToIsoDate(today, interval) }).eq('id', task.id);
  }

  if (skipIds.length > 0) {
    await service.from('tasks').update({ is_archived: true }).in('id', skipIds);
  }

  return {
    critical: criticalIds.length,
    decisions,
    flexible: flexible.length,
    skipped: skipIds.length,
  };
};

const classifyWithAi = async (
  env: Parameters<typeof runOpenRouterJson>[0],
  tasks: Array<{ category: string; effort_points: number; id: string; interval_days: number | null; next_due: string | null }>,
) => {
  if (tasks.length === 0) {
    return [];
  }

  const payload = tasks.map((task) => ({
    category: task.category,
    effort_points: task.effort_points,
    id: task.id,
    interval_days: task.interval_days,
    overdue_days: task.next_due === null ? 0 : overdueDays(task.next_due),
  }));

  try {
    const result = await runOpenRouterJson<unknown>(env, [
      { content: CATCHUP_PROMPT, role: 'system' },
      { content: JSON.stringify(payload), role: 'user' },
    ], 'json_classification');
    return aiDecisionSchema.parse(result);
  } catch {
    return payload.map((task) => fallbackDecision(task));
  }
};

const fallbackDecision = (task: { category: string; effort_points: number; id: string; overdue_days: number }) => {
  if (CRITICAL_CATEGORIES.has(task.category)) {
    return { bucket: 'CRITICAL', reason: 'must stay visible', task_id: task.id };
  }
  if (SKIP_CATEGORIES.has(task.category) || (task.overdue_days >= FOURTEEN && task.effort_points === 1)) {
    return { bucket: 'SKIP', reason: 'low leverage this round', task_id: task.id };
  }
  return { bucket: 'FLEXIBLE', reason: 'reschedule with breathing room', task_id: task.id };
};
