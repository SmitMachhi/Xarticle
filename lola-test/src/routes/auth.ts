import { Hono } from 'hono';
import { z } from 'zod';

import { HTTP_BAD_REQUEST, HTTP_UNAUTHORIZED } from '../constants';
import { parseBody, toAppError } from '../lib/http';
import { getAnonClient, getServiceClient, getUserClient } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import type { AppVariables, EnvBindings } from '../types';

const appleBodySchema = z.object({
  display_name: z.string().min(1),
  id_token: z.string().min(1),
  timezone: z.string().min(1),
});

const magicLinkSchema = z.object({
  email: z.email(),
});

const verifySchema = z.object({
  token: z.string().min(1),
  type: z.literal('magiclink'),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

const apnsTokenSchema = z.object({
  token: z.string().min(1),
});

const sessionSchema = z.object({
  display_name: z.string().min(1).optional(),
  timezone: z.string().min(1),
});

export const authRoutes = new Hono<{ Bindings: EnvBindings; Variables: AppVariables }>();

authRoutes.post('/apple', async (ctx) => {
  const body = await parseBody(ctx, appleBodySchema);
  const anon = getAnonClient(ctx.env);
  const authResult = await anon.auth.signInWithIdToken({
    provider: 'apple',
    token: body.id_token,
  });

  if (authResult.error !== null || authResult.data.session === null || authResult.data.user === null) {
    throw toAppError('AUTH_FAILED', authResult.error?.message ?? 'apple sign-in failed', HTTP_UNAUTHORIZED);
  }

  const service = getServiceClient(ctx.env);
  const userId = authResult.data.user.id;
  const existing = await service.from('users').select('id').eq('id', userId).maybeSingle();

  if (existing.data === null) {
    const inserted = await service.from('users').insert({
      display_name: body.display_name,
      id: userId,
      timezone: body.timezone,
    });
    if (inserted.error !== null) {
      throw toAppError('USER_CREATE_FAILED', inserted.error.message, HTTP_BAD_REQUEST);
    }
  } else {
    const updateResult = await service.from('users').update({ last_seen_at: new Date().toISOString() }).eq('id', userId);
    if (updateResult.error !== null) {
      throw toAppError('USER_UPDATE_FAILED', updateResult.error.message, HTTP_BAD_REQUEST);
    }
  }

  const userQuery = await service.from('users').select('*').eq('id', userId).single();
  if (userQuery.error !== null) {
    throw toAppError('USER_FETCH_FAILED', userQuery.error.message, HTTP_BAD_REQUEST);
  }

  return ctx.json({
    access_token: authResult.data.session.access_token,
    is_new_user: existing.data === null,
    refresh_token: authResult.data.session.refresh_token,
    user: userQuery.data,
  });
});

authRoutes.post('/magic-link', async (ctx) => {
  const body = await parseBody(ctx, magicLinkSchema);
  const anon = getAnonClient(ctx.env);
  const result = await anon.auth.signInWithOtp({ email: body.email });
  if (result.error !== null) {
    throw toAppError('MAGIC_LINK_FAILED', result.error.message, HTTP_BAD_REQUEST);
  }
  return ctx.json({ message: 'magic link sent' });
});

authRoutes.post('/verify', async (ctx) => {
  const body = await parseBody(ctx, verifySchema);
  const anon = getAnonClient(ctx.env);
  const verified = await anon.auth.verifyOtp({
    token_hash: body.token,
    type: 'magiclink',
  });
  if (verified.error !== null || verified.data.session === null || verified.data.user === null) {
    throw toAppError('VERIFY_FAILED', verified.error?.message ?? 'verification failed', HTTP_UNAUTHORIZED);
  }

  return ctx.json({
    access_token: verified.data.session.access_token,
    refresh_token: verified.data.session.refresh_token,
    user: verified.data.user,
  });
});

authRoutes.post('/refresh', async (ctx) => {
  const body = await parseBody(ctx, refreshSchema);
  const anon = getAnonClient(ctx.env);
  const refreshed = await anon.auth.refreshSession({ refresh_token: body.refresh_token });
  if (refreshed.error !== null || refreshed.data.session === null) {
    throw toAppError('REFRESH_FAILED', refreshed.error?.message ?? 'refresh failed', HTTP_UNAUTHORIZED);
  }

  return ctx.json({
    access_token: refreshed.data.session.access_token,
    refresh_token: refreshed.data.session.refresh_token,
  });
});

// Called by the web app after any OAuth sign-in (Google, etc.)
// The DB trigger (005_auth_trigger.sql) ensures the user row exists before this is called.
// This endpoint updates display_name + timezone and returns the full user profile.
authRoutes.post('/session', authMiddleware, async (ctx) => {
  const body = await parseBody(ctx, sessionSchema);
  const auth = ctx.get('auth');
  const userClient = getUserClient(ctx.env, auth.accessToken);

  const updateResult = await userClient
    .from('users')
    .update({
      ...(body.display_name !== undefined && { display_name: body.display_name }),
      last_seen_at: new Date().toISOString(),
      timezone: body.timezone,
    })
    .eq('id', auth.userId)
    .select('*')
    .single();

  if (updateResult.error !== null) {
    throw toAppError('SESSION_UPDATE_FAILED', updateResult.error.message, HTTP_BAD_REQUEST);
  }

  const user = updateResult.data;
  return ctx.json({
    is_new_user: user.household_id === null,
    user,
  });
});

authRoutes.post('/apns-token', authMiddleware, async (ctx) => {
  const body = await parseBody(ctx, apnsTokenSchema);
  const auth = ctx.get('auth');
  const userClient = getUserClient(ctx.env, auth.accessToken);
  const result = await userClient.from('users').update({ apns_token: body.token }).eq('id', auth.userId);
  if (result.error !== null) {
    throw toAppError('APNS_TOKEN_UPDATE_FAILED', result.error.message, HTTP_BAD_REQUEST);
  }
  return ctx.json({ success: true });
});
