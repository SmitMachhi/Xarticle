import { Hono } from 'hono';
import { z } from 'zod';

import { dispatchDomainEvent } from '../agent/event-dispatch';
import {
  DEFAULT_LOLA_PERSONALITY,
  HTTP_BAD_REQUEST,
  HTTP_INTERNAL_ERROR,
  ROLE_ADMIN,
  ROLE_MEMBER,
  THREE,
} from '../constants';
import { requireAdmin, requireHousehold } from '../lib/authz';
import { toCsv } from '../lib/csv';
import { assertCanLeave, assertCapacity, assertDemotionAllowed, getPlanMemberLimit } from '../lib/households';
import { parseBody, toAppError } from '../lib/http';
import { makeInviteCode } from '../lib/invite';
import { getServiceClient, getUserClient, mustData } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import type { AppVariables, EnvBindings, UserRow } from '../types';

const createBodySchema = z.object({
  name: z.string().min(1),
  timezone: z.string().min(1),
});

const patchBodySchema = z.object({
  lola_personality: z.enum(['balanced', 'calm', 'sassy']).optional(),
  name: z.string().min(1).optional(),
});

const joinBodySchema = z.object({
  invite_code: z.string().min(1).transform((value) => value.toUpperCase()),
});

const rolePatchSchema = z.object({
  role: z.enum(['admin', 'member']),
});

export const householdRoutes = new Hono<{ Bindings: EnvBindings; Variables: AppVariables }>();

householdRoutes.get('/invite/:code', async (ctx) => {
  const code = (ctx.req.param('code') ?? '').toUpperCase();
  const service = getServiceClient(ctx.env);
  const householdQuery = await service
    .from('households')
    .select('id, name, plan, is_active')
    .eq('invite_code', code)
    .maybeSingle();

  const household = mustData(householdQuery.data, householdQuery.error, 'INVITE_NOT_FOUND');
  const members = await service.from('users').select('id').eq('household_id', household.id);
  if (members.error !== null) {
    throw toAppError('MEMBER_COUNT_FAILED', members.error.message, HTTP_BAD_REQUEST);
  }

  const count = members.data.length;
  const maxMembers = getPlanMemberLimit(household.plan);
  return ctx.json({
    household_name: household.name,
    is_full: count >= maxMembers,
    max_members: maxMembers,
    member_count: count,
    plan: household.plan,
  });
});

householdRoutes.use('*', authMiddleware);

householdRoutes.post('/', async (ctx) => {
  const body = await parseBody(ctx, createBodySchema);
  const auth = ctx.get('auth');
  const service = getServiceClient(ctx.env);

  const household = await insertHouseholdWithCode(service, body.name, body.timezone);
  const updateUser = await service.from('users').update({ household_id: household.id, role: ROLE_ADMIN, timezone: body.timezone }).eq('id', auth.userId);
  if (updateUser.error !== null) {
    throw toAppError('USER_LINK_FAILED', updateUser.error.message, HTTP_BAD_REQUEST);
  }

  await dispatchDomainEvent({
    env: ctx.env,
    event: {
      actor_user_id: auth.userId,
      audience_user_ids: [auth.userId],
      facts: { household_name: body.name },
      household_id: household.id,
      type: 'household_created',
    },
    service,
  });

  return ctx.json({ household, invite_code: household.invite_code });
});

householdRoutes.get('/me', async (ctx) => {
  const householdId = requireHousehold(ctx);
  const userClient = getUserClient(ctx.env, ctx.get('auth').accessToken);
  const household = await userClient.from('households').select('*').eq('id', householdId).maybeSingle();
  const members = await userClient.from('users').select('*').eq('household_id', householdId).order('created_at', { ascending: true });
  return ctx.json({
    household: mustData(household.data, household.error, 'HOUSEHOLD_LOOKUP_FAILED'),
    members: mustData(members.data, members.error, 'MEMBERS_LOOKUP_FAILED'),
    my_role: ctx.get('auth').role,
  });
});

householdRoutes.patch('/me', async (ctx) => {
  requireAdmin(ctx);
  const householdId = requireHousehold(ctx);
  const body = await parseBody(ctx, patchBodySchema);
  const userClient = getUserClient(ctx.env, ctx.get('auth').accessToken);
  const result = await userClient.from('households').update(body).eq('id', householdId).select('*').single();
  return ctx.json({ household: mustData(result.data, result.error, 'HOUSEHOLD_UPDATE_FAILED') });
});

householdRoutes.post('/join', async (ctx) => {
  const body = await parseBody(ctx, joinBodySchema);
  const userId = ctx.get('auth').userId;
  const service = getServiceClient(ctx.env);
  const household = await service.from('households').select('*').eq('invite_code', body.invite_code).maybeSingle();
  const picked = mustData(household.data, household.error, 'INVITE_NOT_FOUND');
  const members = await service.from('users').select('*').eq('household_id', picked.id);
  const memberRows = mustData(members.data, members.error, 'MEMBERS_LOOKUP_FAILED') as UserRow[];

  assertCapacity(memberRows.length, picked.plan);
  const joined = await service.from('users').update({ household_id: picked.id, role: ROLE_MEMBER }).eq('id', userId);
  if (joined.error !== null) {
    throw toAppError('JOIN_FAILED', joined.error.message, HTTP_BAD_REQUEST);
  }

  const joiningUser = await service.from('users').select('display_name, avatar_color').eq('id', userId).single();
  const profile = mustData(joiningUser.data, joiningUser.error, 'USER_LOOKUP_FAILED');
  await service.from('feed_events').insert({
    event_type: 'member_joined',
    household_id: picked.id,
    payload: { avatar_color: profile.avatar_color, new_member_name: profile.display_name },
  });
  await dispatchDomainEvent({
    env: ctx.env,
    event: {
      actor_user_id: userId,
      audience_user_ids: [userId],
      facts: { member_name: profile.display_name },
      household_id: picked.id,
      type: 'member_joined',
    },
    service,
  });

  const allMembers = await service.from('users').select('*').eq('household_id', picked.id);
  return ctx.json({ household: picked, members: mustData(allMembers.data, allMembers.error, 'MEMBERS_LOOKUP_FAILED') });
});

householdRoutes.delete('/me/leave', async (ctx) => {
  const auth = ctx.get('auth');
  const householdId = requireHousehold(ctx);
  const service = getServiceClient(ctx.env);
  const members = await service.from('users').select('*').eq('household_id', householdId);
  const memberRows = mustData(members.data, members.error, 'MEMBERS_LOOKUP_FAILED') as UserRow[];
  assertCanLeave(auth.userId, memberRows);

  if (memberRows.length <= 1) {
    const deleteResult = await service.from('households').delete().eq('id', householdId);
    if (deleteResult.error !== null) {
      throw toAppError('HOUSEHOLD_DELETE_FAILED', deleteResult.error.message, HTTP_BAD_REQUEST);
    }
  } else {
    const leaveResult = await service.from('users').update({ household_id: null, role: ROLE_MEMBER }).eq('id', auth.userId);
    if (leaveResult.error !== null) {
      throw toAppError('LEAVE_FAILED', leaveResult.error.message, HTTP_BAD_REQUEST);
    }
  }
  return ctx.json({ success: true });
});

householdRoutes.patch('/me/members/:user_id/role', async (ctx) => {
  requireAdmin(ctx);
  const body = await parseBody(ctx, rolePatchSchema);
  const auth = ctx.get('auth');
  const householdId = requireHousehold(ctx);
  const targetId = ctx.req.param('user_id');
  const service = getServiceClient(ctx.env);
  const members = await service.from('users').select('*').eq('household_id', householdId);
  const memberRows = mustData(members.data, members.error, 'MEMBERS_LOOKUP_FAILED') as UserRow[];
  assertDemotionAllowed(auth.userId, targetId, body.role, memberRows);
  const patched = await service.from('users').update({ role: body.role }).eq('id', targetId).eq('household_id', householdId).select('*').single();
  return ctx.json({ user: mustData(patched.data, patched.error, 'ROLE_PATCH_FAILED') });
});

householdRoutes.get('/me/export', async (ctx) => {
  const householdId = requireHousehold(ctx);
  const userClient = getUserClient(ctx.env, ctx.get('auth').accessToken);
  const completions = await userClient
    .from('completions')
    .select('id, task_id, completed_by, completed_at, xp_awarded, effort_points')
    .eq('household_id', householdId);
  const tasks = await userClient.from('tasks').select('id, title, category, recurrence_type, effort_points').eq('household_id', householdId);
  const rows = [
    ...mustData(tasks.data, tasks.error, 'TASKS_EXPORT_FAILED').map((task) => ({ ...task, row_type: 'task' })),
    ...mustData(completions.data, completions.error, 'COMPLETIONS_EXPORT_FAILED').map((completion) => ({ ...completion, row_type: 'completion' })),
  ].map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value ?? '')])));

  const csv = toCsv(rows);
  ctx.header('Content-Type', 'text/csv; charset=utf-8');
  ctx.header('Content-Disposition', 'attachment; filename="lola-export.csv"');
  return ctx.body(csv);
});

const insertHouseholdWithCode = async (
  service: ReturnType<typeof getServiceClient>,
  name: string,
  timezone: string,
): Promise<Record<string, unknown> & { id: string; invite_code: string }> => {
  for (let attempt = 0; attempt < THREE; attempt += 1) {
    const inviteCode = makeInviteCode();
    const insertResult = await service.from('households').insert({ lola_personality: DEFAULT_LOLA_PERSONALITY, name, timezone, invite_code: inviteCode }).select('*').maybeSingle();
    if (insertResult.error === null && insertResult.data !== null) {
      return insertResult.data;
    }
  }
  throw toAppError('INVITE_GENERATION_FAILED', 'could not generate invite code', HTTP_INTERNAL_ERROR);
};
