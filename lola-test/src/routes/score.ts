import { Hono } from 'hono';

import { HOUSEHOLD, ONE_HUNDRED } from '../constants';
import { requireHousehold } from '../lib/authz';
import { calculateHomeScore } from '../lib/score';
import { computeScoreMetrics } from '../lib/score-metrics';
import { getUserClient, mustData } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import { entitlementMiddleware } from '../middleware/entitlement';
import type { AppVariables, EnvBindings } from '../types';

export const scoreRoutes = new Hono<{ Bindings: EnvBindings; Variables: AppVariables }>();

scoreRoutes.use('*', authMiddleware, entitlementMiddleware);

scoreRoutes.get('/', async (ctx) => {
  const householdId = requireHousehold(ctx);
  const userClient = getUserClient(ctx.env, ctx.get('auth').accessToken);
  const [lists, tasks, completions, users, household] = await Promise.all([
    userClient.from('lists').select('id, list_type').eq('household_id', householdId).eq('is_archived', false),
    userClient.from('tasks').select('id, list_id, streak_count, next_due').eq('household_id', householdId).eq('is_archived', false),
    userClient.from('completions').select('id, list_id, completed_by, completed_at').eq('household_id', householdId),
    userClient.from('users').select('id, display_name, ring_progress, avatar_color').eq('household_id', householdId),
    userClient.from('households').select('family_streak, family_ring_progress').eq('id', householdId).single(),
  ]);

  const listRows = mustData(lists.data, lists.error, 'LISTS_FETCH_FAILED');
  const householdListIds = new Set(listRows.filter((list) => list.list_type === HOUSEHOLD).map((list) => list.id));
  const taskRows = mustData(tasks.data, tasks.error, 'TASKS_FETCH_FAILED').filter((task) => householdListIds.has(task.list_id));
  const completionRows = mustData(completions.data, completions.error, 'COMPLETIONS_FETCH_FAILED').filter((item) =>
    householdListIds.has(item.list_id),
  );
  const metrics = computeScoreMetrics(listRows, taskRows, completionRows);
  const score = calculateHomeScore({
    activeTaskCount: metrics.dueInScoreWindow,
    completedInWindow: metrics.completedInScoreWindow,
    coveredListCount: metrics.coveredListCount,
    dueTaskCount: metrics.dueInScoreWindow,
    listCount: metrics.householdListCount,
    streakAverage: metrics.streakAverage,
  });

  const memberRows = mustData(users.data, users.error, 'USERS_FETCH_FAILED');
  const familyRing = memberRows.length > 0 ? Math.round((membersWithCompletion(completionRows) / memberRows.length) * ONE_HUNDRED) : 0;
  const householdRow = mustData(household.data, household.error, 'HOUSEHOLD_FETCH_FAILED');

  return ctx.json({
    breakdown: score.breakdown,
    family_ring_progress: Math.max(householdRow.family_ring_progress, familyRing),
    family_streak: householdRow.family_streak,
    home_score: score.score,
    label: score.label,
    member_rings: memberRows,
  });
});

const membersWithCompletion = (rows: Array<{ completed_by: string }>): number => {
  return new Set(rows.map((row) => row.completed_by)).size;
};
