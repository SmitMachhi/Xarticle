import { Hono } from 'hono';
import { z } from 'zod';

import { FEED_DEFAULT_LIMIT, THIRTY } from '../constants';
import { requireHousehold } from '../lib/authz';
import { parseQuery } from '../lib/http';
import { getUserClient, mustData } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import { entitlementMiddleware } from '../middleware/entitlement';
import type { AppVariables, EnvBindings } from '../types';

const querySchema = z.object({
  before: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(THIRTY).default(FEED_DEFAULT_LIMIT),
});

export const feedRoutes = new Hono<{ Bindings: EnvBindings; Variables: AppVariables }>();

feedRoutes.use('*', authMiddleware, entitlementMiddleware);

feedRoutes.get('/', async (ctx) => {
  const query = parseQuery(ctx.req.query(), querySchema);
  const householdId = requireHousehold(ctx);
  const userClient = getUserClient(ctx.env, ctx.get('auth').accessToken);
  let builder = userClient
    .from('feed_events')
    .select('id, household_id, actor_id, task_id, completion_id, payload, event_type, created_at')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
    .limit(query.limit);

  if (query.before !== undefined) {
    builder = builder.lt('created_at', query.before);
  }

  const eventsQuery = await builder;
  const events = mustData(eventsQuery.data, eventsQuery.error, 'FEED_FETCH_FAILED');
  const actorIds = [...new Set(events.map((event) => event.actor_id).filter((id): id is string => id !== null))];
  const actorsQuery =
    actorIds.length > 0
      ? await userClient.from('users').select('id, display_name, avatar_color').in('id', actorIds)
      : { data: [], error: null };

  const actors = mustData(actorsQuery.data, actorsQuery.error, 'ACTOR_FETCH_FAILED');
  const actorMap = new Map(actors.map((actor) => [actor.id, actor]));
  const merged = events.map((event) => ({
    ...event,
    actor_avatar_color: event.actor_id === null ? null : (actorMap.get(event.actor_id)?.avatar_color ?? null),
    actor_display_name: event.actor_id === null ? null : (actorMap.get(event.actor_id)?.display_name ?? null),
  }));

  return ctx.json({ events: merged });
});
