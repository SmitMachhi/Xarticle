import { createRemoteJWKSet, jwtVerify } from 'jose';

import { HTTP_UNAUTHORIZED, ROLE_MEMBER } from '../constants';
import { toAppError } from '../lib/http';
import { getUserClient, mustData } from '../lib/supabase';
import type { AppContext } from '../types';

const BEARER_PREFIX = 'Bearer ';

export const authMiddleware = async (ctx: AppContext, next: () => Promise<void>): Promise<void> => {
  const authorization = ctx.req.header('Authorization') ?? '';
  if (!authorization.startsWith(BEARER_PREFIX)) {
    throw toAppError('UNAUTHORIZED', 'missing bearer token', HTTP_UNAUTHORIZED);
  }

  const token = authorization.slice(BEARER_PREFIX.length);
  const payload = await verifyToken(token, ctx.env.SUPABASE_URL);
  const userId = payload.sub;
  if (typeof userId !== 'string' || userId.length === 0) {
    throw toAppError('UNAUTHORIZED', 'invalid token subject', HTTP_UNAUTHORIZED);
  }

  const client = getUserClient(ctx.env, token);
  const user = await client
    .from('users')
    .select('household_id, role')
    .eq('id', userId)
    .maybeSingle();

  const userRow = mustData(user.data, user.error, 'USER_LOOKUP_FAILED');
  const role = userRow.role === 'admin' ? 'admin' : ROLE_MEMBER;

  ctx.set('auth', {
    accessToken: token,
    householdId: userRow.household_id,
    role,
    userId,
  });
  await next();
};

const verifyToken = async (token: string, supabaseUrl: string): Promise<{ sub?: string }> => {
  try {
    const JWKS = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
    const verified = await jwtVerify(token, JWKS);
    return verified.payload;
  } catch {
    throw toAppError('UNAUTHORIZED', 'invalid jwt', HTTP_UNAUTHORIZED);
  }
};
