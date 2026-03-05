import { Hono } from 'hono';
import { z } from 'zod';

import { onboardSuggestionPayloadSchema } from '../agent/onboard-suggestions';
import { HTTP_BAD_REQUEST } from '../constants';
import { parseBody, toAppError } from '../lib/http';
import { processOnboardSuggestionJob } from '../lib/onboard-job-processor';
import { applyOnboardSuggestions } from '../lib/onboard-jobs';
import { MINIMAX_MODEL } from '../lib/openrouter-request';
import { getUserClient, mustData } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import type { AppVariables, EnvBindings } from '../types';

const onboardBodySchema = z.object({
  has_kids: z.boolean(),
  home_type: z.string(),
  household_id: z.string().uuid(),
  num_people: z.number().int().min(1),
  struggle_area: z.string(),
});

const applyBodySchema = z.object({
  selected_list_ids: z.array(z.string()).default([]),
  selected_task_ids: z.array(z.string()).default([]),
});

export const onboardRoutes = new Hono<{ Bindings: EnvBindings; Variables: AppVariables }>();

onboardRoutes.use('*', authMiddleware);

onboardRoutes.post('/', async (ctx) => {
  const body = await parseBody(ctx, onboardBodySchema);
  const auth = ctx.get('auth');
  if (auth.householdId === null || auth.householdId !== body.household_id) {
    throw toAppError('ONBOARD_HOUSEHOLD_MISMATCH', 'invalid household for onboarding', HTTP_BAD_REQUEST);
  }

  const userClient = getUserClient(ctx.env, auth.accessToken);
  const inserted = await userClient
    .from('onboarding_suggestion_jobs')
    .insert({
      household_id: body.household_id,
      input: body,
      model: MINIMAX_MODEL,
      requested_by: auth.userId,
      status: 'queued',
    })
    .select('id, status')
    .single();

  const job = mustData(inserted.data, inserted.error, 'ONBOARD_JOB_CREATE_FAILED');
  ctx.executionCtx.waitUntil(processOnboardSuggestionJob(ctx.env, job.id, body, auth.userId));
  return ctx.json({ job_id: job.id, manual_first: true, mode: 'suggestions_only', status: job.status });
});

onboardRoutes.get('/suggestions/:job_id', async (ctx) => {
  const userClient = getUserClient(ctx.env, ctx.get('auth').accessToken);
  const jobId = ctx.req.param('job_id');
  const job = await userClient.from('onboarding_suggestion_jobs').select('id, status, suggestions, error_code').eq('id', jobId).maybeSingle();
  const picked = mustData(job.data, job.error, 'ONBOARD_JOB_NOT_FOUND');

  if (picked.status !== 'ready') {
    return ctx.json({
      job_id: picked.id,
      status: picked.status,
      ...(picked.error_code === null ? {} : { error: picked.error_code }),
      suggestions: null,
    });
  }

  const parsed = onboardSuggestionPayloadSchema.safeParse(picked.suggestions);
  if (!parsed.success) {
    return ctx.json({ error: 'ONBOARD_SUGGESTIONS_INVALID', job_id: picked.id, status: 'failed', suggestions: null });
  }
  return ctx.json({ job_id: picked.id, status: picked.status, suggestions: parsed.data });
});

onboardRoutes.post('/suggestions/:job_id/apply', async (ctx) => {
  const body = await parseBody(ctx, applyBodySchema);
  const idempotencyKey = (ctx.req.header('x-idempotency-key') ?? '').trim();
  if (idempotencyKey.length === 0) {
    throw toAppError('ONBOARD_IDEMPOTENCY_REQUIRED', 'x-idempotency-key header required', HTTP_BAD_REQUEST);
  }

  const auth = ctx.get('auth');
  const result = await applyOnboardSuggestions(ctx.env, auth.accessToken, auth.userId, ctx.req.param('job_id'), body, idempotencyKey);
  return ctx.json(result);
});
