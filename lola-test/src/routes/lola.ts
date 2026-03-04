import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';

import { runInLane } from '../agent/laneQueue';
import { runLolaLoop } from '../agent/loop';
import { executeTool } from '../agent/tools';
import { HTTP_BAD_REQUEST, SSE_EVENT_DELTA, SSE_EVENT_DONE } from '../constants';
import { requireHousehold } from '../lib/authz';
import { parseBody, toAppError } from '../lib/http';
import { parseMessagePagination } from '../lib/pagination';
import { getServiceClient, getUserClient, mustData } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import { entitlementMiddleware } from '../middleware/entitlement';
import { lolaRateLimitMiddleware } from '../middleware/rateLimit';
import type { AppVariables, EnvBindings, UserRole } from '../types';

const messageBodySchema = z.object({
  content: z.string().min(1),
  reply_to_id: z.string().uuid().optional(),
});

const actionBodySchema = z.object({
  action: z.string(),
  message_id: z.string().uuid(),
});

export const lolaRoutes = new Hono<{ Bindings: EnvBindings; Variables: AppVariables }>();

lolaRoutes.use('*', authMiddleware, entitlementMiddleware);

lolaRoutes.post('/message', lolaRateLimitMiddleware, async (ctx) => {
  const body = await parseBody(ctx, messageBodySchema);
  const auth = ctx.get('auth');
  const householdId = requireHousehold(ctx);
  const service = getServiceClient(ctx.env);
  const userMessage = await service
    .from('lola_messages')
    .insert({ content: body.content, household_id: householdId, reply_to_id: body.reply_to_id ?? null, role: 'user', user_id: auth.userId })
    .select('id')
    .single();

  mustData(userMessage.data, userMessage.error, 'LOLA_MESSAGE_CREATE_FAILED');
  const laneKey = `${householdId}:${auth.userId}`;

  return streamSSE(ctx, async (stream) => {
    const result = await runInLane(laneKey, async () => {
      return await runLolaLoop(ctx.env, {
        householdId,
        onDelta: async (chunk) => {
          await stream.writeSSE({
            data: JSON.stringify({ text: chunk }),
            event: SSE_EVENT_DELTA,
          });
        },
        role: auth.role,
        userId: auth.userId,
        userMessage: body.content,
      });
    });

    const messageId = await saveLolaResponse(service, householdId, auth.userId, result.actions, result.text);
    await stream.writeSSE({
      data: JSON.stringify({ has_actions: result.actions.length > 0, message_id: messageId }),
      event: SSE_EVENT_DONE,
    });
  });
});

lolaRoutes.get('/messages', async (ctx) => {
  const auth = ctx.get('auth');
  const pagination = parseMessagePagination(ctx.req.query());
  const userClient = getUserClient(ctx.env, auth.accessToken);
  let query = userClient.from('lola_messages').select('*').eq('user_id', auth.userId).order('created_at', { ascending: false }).limit(pagination.limit);
  if (pagination.before !== null) {
    query = query.lt('created_at', pagination.before);
  }

  const messages = await query;
  return ctx.json({ messages: mustData(messages.data, messages.error, 'LOLA_MESSAGES_FETCH_FAILED') });
});

lolaRoutes.post('/action', async (ctx) => {
  const body = await parseBody(ctx, actionBodySchema);
  const auth = ctx.get('auth');
  const householdId = requireHousehold(ctx);
  const userClient = getUserClient(ctx.env, auth.accessToken);
  const service = getServiceClient(ctx.env);
  const message = await userClient.from('lola_messages').select('actions, user_id').eq('id', body.message_id).maybeSingle();
  const picked = mustData(message.data, message.error, 'LOLA_MESSAGE_NOT_FOUND');

  if (picked.user_id !== auth.userId) {
    throw toAppError('ACTION_FORBIDDEN', 'message belongs to another user', HTTP_BAD_REQUEST);
  }

  if (isResolved(picked.actions)) {
    throw toAppError('ACTION_ALREADY_RESOLVED', 'action already resolved', HTTP_BAD_REQUEST);
  }

  const actions = parseActions(picked.actions);
  const selected = actions.find((action) => action.action === body.action);
  if (selected === undefined) {
    throw toAppError('ACTION_NOT_FOUND', 'action not available', HTTP_BAD_REQUEST);
  }
  if (selected.requires_role === 'admin' && auth.role !== 'admin') {
    throw toAppError('ACTION_ROLE_FORBIDDEN', 'action requires admin role', HTTP_BAD_REQUEST);
  }

  await executeLolaAction(ctx.env, body.action, auth.role, auth.userId, householdId);
  await service
    .from('lola_messages')
    .update({ actions: { resolved: true, resolved_action: body.action, resolved_by: auth.userId } })
    .eq('id', body.message_id);

  return ctx.json({ success: true });
});

const saveLolaResponse = async (
  service: ReturnType<typeof getServiceClient>,
  householdId: string,
  userId: string,
  actions: Array<{ action: string; label: string; requires_role: UserRole }>,
  text: string,
): Promise<string> => {
  const saved = await service
    .from('lola_messages')
    .insert({ actions: actions.length > 0 ? actions : null, content: text, household_id: householdId, role: 'lola', user_id: userId })
    .select('id')
    .single();
  return mustData(saved.data, saved.error, 'LOLA_RESPONSE_SAVE_FAILED').id;
};

const parseActions = (value: unknown): Array<{ action: string; label: string; requires_role: UserRole }> => {
  const parsed = z
    .array(
      z.object({
        action: z.string(),
        label: z.string(),
        requires_role: z.enum(['admin', 'member']),
      }),
    )
    .safeParse(value);

  if (!parsed.success) {
    return [];
  }
  return parsed.data;
};

const executeLolaAction = async (
  env: EnvBindings,
  action: string,
  role: UserRole,
  userId: string,
  householdId: string,
): Promise<void> => {
  if (action === 'catchup_triage') {
    await executeTool({ env, householdId, role, userId }, 'trigger_catchup', { mode: 'triage' });
    return;
  }
  if (action === 'catchup_clear') {
    await executeTool({ env, householdId, role, userId }, 'trigger_catchup', { mode: 'clear' });
    return;
  }
  if (action === 'streak_shield') {
    await executeTool({ env, householdId, role, userId }, 'protect_streak', {});
    return;
  }
  if (action === 'streak_accept') {
    await executeTool({ env, householdId, role, userId }, 'break_streak', {});
  }
};

const isResolved = (value: unknown): boolean => {
  const parsed = z
    .object({
      resolved: z.boolean(),
    })
    .safeParse(value);
  return parsed.success && parsed.data.resolved;
};
