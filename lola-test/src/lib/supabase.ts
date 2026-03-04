import { createClient, type PostgrestError, type SupabaseClient } from '@supabase/supabase-js';

import { HTTP_BAD_REQUEST, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from '../constants';
import type { EnvBindings } from '../types';
import { toAppError } from './http';

let cachedAnonClient: SupabaseClient | null = null;
let cachedClient: SupabaseClient | null = null;

export const getServiceClient = (env: EnvBindings): SupabaseClient => {
  if (cachedClient !== null) {
    return cachedClient;
  }
  cachedClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return cachedClient;
};

export const getAnonClient = (env: EnvBindings): SupabaseClient => {
  if (cachedAnonClient !== null) {
    return cachedAnonClient;
  }
  cachedAnonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  return cachedAnonClient;
};

export const getUserClient = (env: EnvBindings, accessToken: string): SupabaseClient => {
  if (accessToken.trim().length === 0) {
    throw toAppError('UNAUTHORIZED', 'missing access token', HTTP_UNAUTHORIZED);
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

export const mustData = <T>(data: T | null, error: PostgrestError | null, fallbackCode: string): T => {
  if (error !== null) {
    throw toAppError(fallbackCode, error.message, HTTP_BAD_REQUEST);
  }
  if (data === null) {
    throw toAppError(fallbackCode, 'not found', HTTP_NOT_FOUND);
  }
  return data;
};
