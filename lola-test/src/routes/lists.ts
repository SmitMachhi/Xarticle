import { Hono } from 'hono';
import { z } from 'zod';

import { dispatchDomainEvent } from '../agent/event-dispatch';
import { DEFAULT_LIST_COLOR, HTTP_BAD_REQUEST, ROLE_ADMIN } from '../constants';
import { requireHousehold } from '../lib/authz';
import { parseBody, toAppError } from '../lib/http';
import { getServiceClient, getUserClient, mustData } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import { entitlementMiddleware } from '../middleware/entitlement';
import type { AppVariables, EnvBindings } from '../types';

const listDraftSchema = z.object({
  color: z.string().min(1).default(DEFAULT_LIST_COLOR),
  emoji: z.string().optional(),
  list_type: z.enum(['household', 'personal', 'project']).default('household'),
  name: z.string().min(1),
});

const bulkBodySchema = z.object({
  lists: z.array(listDraftSchema).min(1),
});

const patchBodySchema = z.object({
  color: z.string().min(1).optional(),
  emoji: z.string().optional(),
  is_archived: z.boolean().optional(),
  list_type: z.enum(['household', 'personal', 'project']).optional(),
  name: z.string().min(1).optional(),
});

export const listRoutes = new Hono<{ Bindings: EnvBindings; Variables: AppVariables }>();

listRoutes.use('*', authMiddleware, entitlementMiddleware);

listRoutes.get('/', async (ctx) => {
  const householdId = requireHousehold(ctx);
  const auth = ctx.get('auth');
  const userClient = getUserClient(ctx.env, auth.accessToken);
  const result = await userClient
    .from('lists')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_archived', false)
    .order('created_at', { ascending: true });

  return ctx.json({ lists: mustData(result.data, result.error, 'LISTS_FETCH_FAILED') });
});

listRoutes.post('/', async (ctx) => {
  const body = await parseBody(ctx, listDraftSchema);
  const auth = ctx.get('auth');
  const householdId = requireHousehold(ctx);
  const userClient = getUserClient(ctx.env, auth.accessToken);
  const inserted = await userClient
    .from('lists')
    .insert({ created_by: auth.userId, household_id: householdId, ...body })
    .select('*')
    .single();

  return ctx.json({ list: mustData(inserted.data, inserted.error, 'LIST_CREATE_FAILED') });
});

listRoutes.post('/bulk', async (ctx) => {
  const body = await parseBody(ctx, bulkBodySchema);
  const auth = ctx.get('auth');
  const householdId = requireHousehold(ctx);
  const userClient = getUserClient(ctx.env, auth.accessToken);
  const payload = body.lists.map((draft) => ({ created_by: auth.userId, household_id: householdId, ...draft }));
  const inserted = await userClient.from('lists').insert(payload).select('*');
  return ctx.json({ lists: mustData(inserted.data, inserted.error, 'LIST_BULK_CREATE_FAILED') });
});

listRoutes.patch('/:id', async (ctx) => {
  const body = await parseBody(ctx, patchBodySchema);
  const auth = ctx.get('auth');
  const householdId = requireHousehold(ctx);
  const userClient = getUserClient(ctx.env, auth.accessToken);
  const existing = await userClient
    .from('lists')
    .select('*')
    .eq('id', ctx.req.param('id'))
    .eq('household_id', householdId)
    .maybeSingle();
  const picked = mustData(existing.data, existing.error, 'LIST_NOT_FOUND');

  if (body.list_type !== undefined && body.list_type !== picked.list_type && auth.role !== ROLE_ADMIN) {
    throw toAppError('ADMIN_REQUIRED', 'only admin can change list_type', HTTP_BAD_REQUEST);
  }

  const updated = await userClient.from('lists').update(body).eq('id', picked.id).select('*').single();
  const list = mustData(updated.data, updated.error, 'LIST_UPDATE_FAILED');

  if (body.list_type !== undefined && body.list_type !== picked.list_type) {
    const service = getServiceClient(ctx.env);
    await dispatchDomainEvent({
      env: ctx.env,
      event: {
        actor_user_id: auth.userId,
        audience_user_ids: [auth.userId],
        facts: { list_type: body.list_type },
        household_id: householdId,
        type: 'list_type_changed',
      },
      service,
    });
  }

  return ctx.json({ list });
});

listRoutes.delete('/:id', async (ctx) => {
  if (ctx.get('auth').role !== ROLE_ADMIN) {
    throw toAppError('ADMIN_REQUIRED', 'admin role required', HTTP_BAD_REQUEST);
  }
  const householdId = requireHousehold(ctx);
  const listId = ctx.req.param('id');
  const userClient = getUserClient(ctx.env, ctx.get('auth').accessToken);

  const archiveList = await userClient.from('lists').update({ is_archived: true }).eq('id', listId).eq('household_id', householdId);
  if (archiveList.error !== null) {
    throw toAppError('LIST_ARCHIVE_FAILED', archiveList.error.message, HTTP_BAD_REQUEST);
  }

  const archiveTasks = await userClient.from('tasks').update({ is_archived: true }).eq('list_id', listId).eq('household_id', householdId);
  if (archiveTasks.error !== null) {
    throw toAppError('TASK_ARCHIVE_FAILED', archiveTasks.error.message, HTTP_BAD_REQUEST);
  }

  return ctx.json({ success: true });
});
