import { Hono } from 'hono';

import { TEN } from '../constants';
import { requireHousehold } from '../lib/authz';
import { calculateHomeScore } from '../lib/score';
import { getUserClient, mustData } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import { entitlementMiddleware } from '../middleware/entitlement';
import type { AppVariables, EnvBindings } from '../types';

export const widgetRoutes = new Hono<{ Bindings: EnvBindings; Variables: AppVariables }>();

widgetRoutes.use('*', authMiddleware, entitlementMiddleware);

widgetRoutes.get('/', async (ctx) => {
  const auth = ctx.get('auth');
  const householdId = requireHousehold(ctx);
  const userClient = getUserClient(ctx.env, auth.accessToken);
  const today = new Date().toISOString().slice(0, TEN);
  const [tasks, completions, user, household] = await Promise.all([
    userClient
      .from('tasks')
      .select('id, title, assigned_to, next_due, streak_count')
      .eq('household_id', householdId)
      .eq('assigned_to', auth.userId)
      .eq('is_archived', false),
    userClient.from('completions').select('task_id').eq('household_id', householdId).eq('completed_by', auth.userId).gte('completed_at', `${today}T00:00:00.000Z`),
    userClient.from('users').select('ring_progress').eq('id', auth.userId).single(),
    userClient.from('households').select('family_streak').eq('id', householdId).single(),
  ]);

  const taskRows = mustData(tasks.data, tasks.error, 'TASKS_FETCH_FAILED');
  const completedSet = new Set(mustData(completions.data, completions.error, 'COMPLETION_FETCH_FAILED').map((row) => row.task_id));
  const todaysTasks = taskRows
    .filter((task) => task.next_due === null || task.next_due <= today)
    .map((task) => ({ assigned_to: task.assigned_to, id: task.id, is_completed: completedSet.has(task.id), title: task.title }));

  const score = calculateHomeScore({
    activeTaskCount: taskRows.length,
    completedInWindow: completedSet.size,
    coveredListCount: 0,
    dueTaskCount: taskRows.length,
    listCount: 1,
    streakAverage: average(taskRows.map((task) => task.streak_count)),
  });

  return ctx.json({
    family_streak: mustData(household.data, household.error, 'HOUSEHOLD_FETCH_FAILED').family_streak,
    home_score: score.score,
    label: score.label,
    ring_progress: mustData(user.data, user.error, 'USER_FETCH_FAILED').ring_progress,
    todays_tasks: todaysTasks,
  });
});

const average = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
};
