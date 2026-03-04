import { Hono } from 'hono';
import { z } from 'zod';

import { dispatchDomainEvent } from '../agent/event-dispatch';
import { FIVE, HTTP_BAD_REQUEST, HTTP_FORBIDDEN, ROLE_MEMBER, TASK_CATEGORIES, TEN } from '../constants';
import { requireHousehold } from '../lib/authz';
import { parseBody, parseQuery, toAppError } from '../lib/http';
import { getServiceClient, getUserClient, mustData } from '../lib/supabase';
import { assertAssignable, assertTaskEditAllowed } from '../lib/tasks';
import { authMiddleware } from '../middleware/auth';
import { entitlementMiddleware } from '../middleware/entitlement';
import type { AppVariables, EnvBindings, TaskRow } from '../types';

const taskDraftSchema = z.object({
  assigned_to: z.string().uuid().nullable().optional(),
  category: z.enum(TASK_CATEGORIES).default('other'),
  effort_points: z.coerce.number().int().min(1).max(FIVE).default(2),
  interval_days: z.coerce.number().int().min(1).nullable().optional(),
  is_up_for_grabs: z.boolean().optional(),
  list_id: z.string().uuid(),
  next_due: z.string().optional(),
  recurrence_type: z.enum(['daily', 'every_n_days', 'monthly', 'once', 'weekly']).default('weekly'),
  reminder_time: z.string().optional(),
  title: z.string().min(1),
});

const taskPatchSchema = taskDraftSchema.partial().extend({ title: z.string().min(1).optional() });
const bulkSchema = z.object({ tasks: z.array(taskDraftSchema).min(1) });
const getQuerySchema = z.object({
  assigned_to: z.enum(['all', 'me']).optional(),
  list_id: z.string().uuid().optional(),
  overdue: z.string().optional(),
  up_for_grabs: z.string().optional(),
});

export const taskRoutes = new Hono<{ Bindings: EnvBindings; Variables: AppVariables }>();

taskRoutes.use('*', authMiddleware, entitlementMiddleware);

taskRoutes.get('/', async (ctx) => {
  const query = parseQuery(ctx.req.query(), getQuerySchema);
  const auth = ctx.get('auth');
  const householdId = requireHousehold(ctx);
  const userClient = getUserClient(ctx.env, auth.accessToken);
  let builder = userClient.from('tasks').select('*').eq('household_id', householdId).eq('is_archived', false);

  if (query.list_id !== undefined) {
    builder = builder.eq('list_id', query.list_id);
  }
  if (query.assigned_to === 'me') {
    builder = builder.eq('assigned_to', auth.userId);
  }
  if (query.up_for_grabs === 'true') {
    builder = builder.eq('is_up_for_grabs', true);
  }
  if (query.overdue === 'true') {
    const today = new Date().toISOString().slice(0, TEN);
    builder = builder.lt('next_due', today);
  }

  const result = await builder.order('next_due', { ascending: true });
  return ctx.json({ tasks: mustData(result.data, result.error, 'TASKS_FETCH_FAILED') });
});

taskRoutes.post('/', async (ctx) => {
  const body = await parseBody(ctx, taskDraftSchema);
  const auth = ctx.get('auth');
  const householdId = requireHousehold(ctx);
  assertAssignable(auth.role, auth.userId, body.assigned_to);
  const userClient = getUserClient(ctx.env, auth.accessToken);

  const created = await userClient
    .from('tasks')
    .insert({ created_by: auth.userId, household_id: householdId, ...body })
    .select('*')
    .single();
  const task = mustData(created.data, created.error, 'TASK_CREATE_FAILED');
  if (task.assigned_to !== null) {
    await safePushToAssignee(ctx.env, householdId, task.assigned_to, task.title);
  }
  return ctx.json({ task });
});

taskRoutes.post('/bulk', async (ctx) => {
  const body = await parseBody(ctx, bulkSchema);
  const auth = ctx.get('auth');
  const householdId = requireHousehold(ctx);
  body.tasks.forEach((task) => assertAssignable(auth.role, auth.userId, task.assigned_to));
  const payload = body.tasks.map((task) => ({ created_by: auth.userId, household_id: householdId, ...task }));
  const userClient = getUserClient(ctx.env, auth.accessToken);
  const created = await userClient.from('tasks').insert(payload).select('*');
  return ctx.json({ tasks: mustData(created.data, created.error, 'TASK_BULK_CREATE_FAILED') });
});

taskRoutes.patch('/:id', async (ctx) => {
  const body = await parseBody(ctx, taskPatchSchema);
  const auth = ctx.get('auth');
  const householdId = requireHousehold(ctx);
  const userClient = getUserClient(ctx.env, auth.accessToken);
  const existing = await userClient.from('tasks').select('*').eq('id', ctx.req.param('id')).eq('household_id', householdId).maybeSingle();
  const task = mustData(existing.data, existing.error, 'TASK_NOT_FOUND') as TaskRow;
  assertTaskEditAllowed(auth.role, auth.userId, task);
  assertAssignable(auth.role, auth.userId, body.assigned_to);

  const updated = await userClient.from('tasks').update(body).eq('id', task.id).select('*').single();
  const nextTask = mustData(updated.data, updated.error, 'TASK_UPDATE_FAILED');
  if (nextTask.assigned_to !== null && nextTask.assigned_to !== task.assigned_to) {
    await safePushToAssignee(ctx.env, householdId, nextTask.assigned_to, nextTask.title);
  }
  return ctx.json({ task: nextTask });
});

taskRoutes.delete('/:id', async (ctx) => {
  const auth = ctx.get('auth');
  const householdId = requireHousehold(ctx);
  const userClient = getUserClient(ctx.env, auth.accessToken);
  const existing = await userClient.from('tasks').select('*').eq('id', ctx.req.param('id')).eq('household_id', householdId).maybeSingle();
  const task = mustData(existing.data, existing.error, 'TASK_NOT_FOUND') as TaskRow;
  if (auth.role === ROLE_MEMBER && task.assigned_to !== auth.userId) {
    throw toAppError('TASK_ARCHIVE_FORBIDDEN', 'members can archive only their tasks', HTTP_FORBIDDEN);
  }

  const archived = await userClient.from('tasks').update({ is_archived: true }).eq('id', task.id);
  if (archived.error !== null) {
    throw toAppError('TASK_ARCHIVE_FAILED', archived.error.message, HTTP_BAD_REQUEST);
  }
  return ctx.json({ success: true });
});

const safePushToAssignee = async (
  env: EnvBindings,
  householdId: string,
  userId: string,
  title: string,
): Promise<void> => {
  const service = getServiceClient(env);
  await dispatchDomainEvent({
    env,
    event: {
      audience_user_ids: [userId],
      facts: { task_title: title },
      household_id: householdId,
      type: 'task_assigned',
    },
    service,
  });
};
