import { Hono } from 'hono';
import { z } from 'zod';

import {
  HTTP_BAD_REQUEST,
  PLAN_MEMBER_LIMITS,
  PLAN_PRODUCT_MAP,
  SUBSCRIPTION_EVENTS,
} from '../constants';
import { requireHousehold } from '../lib/authz';
import { parseBody, toAppError } from '../lib/http';
import { getServiceClient, getUserClient, mustData } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import type { AppVariables, EnvBindings } from '../types';

const webhookSchema = z.object({
  event: z.object({
    app_user_id: z.string().optional(),
    expiration_at_ms: z.number().optional(),
    product_id: z.string().optional(),
    type: z.enum(SUBSCRIPTION_EVENTS),
  }),
});

export const subscriptionRoutes = new Hono<{ Bindings: EnvBindings; Variables: AppVariables }>();

subscriptionRoutes.post('/webhook', async (ctx) => {
  const authHeader = ctx.req.header('Authorization') ?? '';
  const expected = `Bearer ${ctx.env.REVENUECAT_WEBHOOK_SECRET}`;
  if (authHeader !== expected) {
    throw toAppError('WEBHOOK_FORBIDDEN', 'invalid webhook secret', HTTP_BAD_REQUEST);
  }

  const body = await parseBody(ctx, webhookSchema);
  const userId = body.event.app_user_id;
  if (userId === undefined) {
    return ctx.json({ success: true });
  }

  const service = getServiceClient(ctx.env);
  const user = await service.from('users').select('household_id').eq('id', userId).maybeSingle();
  const householdId = mustData(user.data, user.error, 'WEBHOOK_USER_NOT_FOUND').household_id;
  if (householdId === null) {
    return ctx.json({ success: true });
  }

  const plan = resolvePlan(body.event.product_id);
  const expiresAt = body.event.expiration_at_ms === undefined ? null : new Date(body.event.expiration_at_ms).toISOString();
  if (body.event.type === 'INITIAL_PURCHASE' || body.event.type === 'RENEWAL') {
    await service.from('households').update({ is_active: true, plan, plan_expires_at: expiresAt }).eq('id', householdId);
  }
  if (body.event.type === 'CANCELLATION') {
    await service.from('households').update({ plan_expires_at: expiresAt }).eq('id', householdId);
  }
  if (body.event.type === 'EXPIRATION') {
    await service.from('households').update({ is_active: false, plan_expires_at: expiresAt }).eq('id', householdId);
  }

  return ctx.json({ success: true });
});

subscriptionRoutes.use('/status', authMiddleware);

subscriptionRoutes.get('/status', async (ctx) => {
  const householdId = requireHousehold(ctx);
  const userClient = getUserClient(ctx.env, ctx.get('auth').accessToken);
  const [household, members] = await Promise.all([
    userClient.from('households').select('plan, is_active, plan_expires_at, trial_expires_at').eq('id', householdId).single(),
    userClient.from('users').select('id').eq('household_id', householdId),
  ]);

  const picked = mustData(household.data, household.error, 'SUBSCRIPTION_STATUS_FAILED');
  const memberCount = mustData(members.data, members.error, 'MEMBER_COUNT_FAILED').length;
  const planKey = normalizePlanKey(picked.plan);
  const maxMembers = PLAN_MEMBER_LIMITS[planKey];

  return ctx.json({
    is_active: picked.is_active,
    max_members: maxMembers,
    member_count: memberCount,
    plan: planKey,
    plan_expires_at: picked.plan_expires_at,
    trial_expires_at: picked.trial_expires_at,
  });
});

const resolvePlan = (productId?: string): keyof typeof PLAN_MEMBER_LIMITS => {
  if (productId === undefined) {
    return 'trial';
  }
  return PLAN_PRODUCT_MAP[productId as keyof typeof PLAN_PRODUCT_MAP] ?? 'trial';
};

const normalizePlanKey = (value: unknown): keyof typeof PLAN_MEMBER_LIMITS => {
  const parsed = z.enum(['duo', 'family_l', 'family_m', 'family_s', 'trial']).safeParse(value);
  if (!parsed.success) {
    return 'trial';
  }
  return parsed.data;
};
