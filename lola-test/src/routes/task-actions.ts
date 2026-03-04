import { Hono } from 'hono';
import { z } from 'zod';

import { HISTORY_DEFAULT_DAYS, HISTORY_MAX_DAYS, HTTP_CONFLICT } from '../constants';
import { requireHousehold } from '../lib/authz';
import { parseBody, parseQuery } from '../lib/http';
import { getServiceClient, getUserClient, mustData } from '../lib/supabase';
import { completeTaskWithEffects } from '../lib/task-completion';
import { claimTaskFlow } from '../lib/tasks';
import { authMiddleware } from '../middleware/auth';
import { entitlementMiddleware } from '../middleware/entitlement';
import type { AppError, AppVariables, EnvBindings, TaskRow } from '../types';

const completeBodySchema = z.object({ photo_url: z.string().optional(), was_catchup: z.boolean().optional() });
const likeBodySchema = z.object({ completion_id: z.string().uuid() });
const historyQuerySchema = z.object({ days: z.coerce.number().int().min(1).max(HISTORY_MAX_DAYS).default(HISTORY_DEFAULT_DAYS) });

export const taskActionRoutes = new Hono<{ Bindings: EnvBindings; Variables: AppVariables }>();

taskActionRoutes.use('*', authMiddleware, entitlementMiddleware);

taskActionRoutes.post('/:id/complete', async (ctx) => {
  const body = await parseBody(ctx, completeBodySchema);
  const auth = ctx.get('auth');
  const householdId = requireHousehold(ctx);
  const userClient = getUserClient(ctx.env, auth.accessToken);
  const service = getServiceClient(ctx.env);
  const existing = await userClient.from('tasks').select('*').eq('id', ctx.req.param('id')).eq('household_id', householdId).maybeSingle();
  const task = mustData(existing.data, existing.error, 'TASK_NOT_FOUND') as TaskRow;
  const completed = await completeTaskWithEffects({
    actorId: auth.userId,
    env: ctx.env,
    photoUrl: body.photo_url,
    service,
    task,
    wasCatchup: body.was_catchup ?? false,
  });

  return ctx.json({
    completion_id: completed.completionId,
    new_streak: completed.newStreak,
    task: completed.task,
    xp_awarded: completed.xpAwarded,
  });
});

taskActionRoutes.post('/:id/claim', async (ctx) => {
  const auth = ctx.get('auth');
  const householdId = requireHousehold(ctx);
  const userClient = getUserClient(ctx.env, auth.accessToken);
  try {
    const task = await claimTaskFlow(userClient, ctx.req.param('id'), auth.userId, householdId);
    return ctx.json({ task });
  } catch (error) {
    if (isAlreadyClaimed(error)) {
      return ctx.json({ claimed_by_name: error.message, error: 'ALREADY_CLAIMED' }, HTTP_CONFLICT);
    }
    throw error;
  }
});

taskActionRoutes.post('/:id/like-completion', async (ctx) => {
  const body = await parseBody(ctx, likeBodySchema);
  const auth = ctx.get('auth');
  const userClient = getUserClient(ctx.env, auth.accessToken);
  const inserted = await userClient
    .from('likes')
    .insert({ completion_id: body.completion_id, liked_by: auth.userId })
    .select('*')
    .single();

  return ctx.json({ like: mustData(inserted.data, inserted.error, 'LIKE_CREATE_FAILED') });
});

taskActionRoutes.get('/history', async (ctx) => {
  const query = parseQuery(ctx.req.query(), historyQuerySchema);
  const householdId = requireHousehold(ctx);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - query.days);

  const userClient = getUserClient(ctx.env, ctx.get('auth').accessToken);
  const completions = await userClient
    .from('completions')
    .select('*, tasks!inner(id,title,category)')
    .eq('household_id', householdId)
    .gte('completed_at', since.toISOString())
    .order('completed_at', { ascending: false });

  return ctx.json({ completions: mustData(completions.data, completions.error, 'COMPLETION_HISTORY_FAILED') });
});

const isAlreadyClaimed = (error: unknown): error is AppError => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  if (!('code' in error)) {
    return false;
  }
  return error.code === 'ALREADY_CLAIMED';
};
