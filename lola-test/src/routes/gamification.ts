import { Hono } from 'hono';

import { requireHousehold } from '../lib/authz';
import { getUserClient, mustData } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import { entitlementMiddleware } from '../middleware/entitlement';
import type { AppVariables, EnvBindings } from '../types';

export const gamificationRoutes = new Hono<{ Bindings: EnvBindings; Variables: AppVariables }>();

gamificationRoutes.use('*', authMiddleware, entitlementMiddleware);

gamificationRoutes.get('/badges', async (ctx) => {
  const auth = ctx.get('auth');
  const userClient = getUserClient(ctx.env, auth.accessToken);
  const result = await userClient.from('badges').select('*').eq('user_id', auth.userId).order('awarded_at', { ascending: false });
  return ctx.json({ badges: mustData(result.data, result.error, 'BADGES_FETCH_FAILED') });
});

gamificationRoutes.get('/household-badges', async (ctx) => {
  const householdId = requireHousehold(ctx);
  const userClient = getUserClient(ctx.env, ctx.get('auth').accessToken);
  const result = await userClient.from('badges').select('*').eq('household_id', householdId).order('awarded_at', { ascending: false });
  return ctx.json({ badges: mustData(result.data, result.error, 'HOUSEHOLD_BADGES_FETCH_FAILED') });
});
