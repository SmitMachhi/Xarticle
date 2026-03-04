import { importPKCS8, SignJWT } from 'jose';

import { HTTP_INTERNAL_ERROR } from '../constants';
import type { EnvBindings } from '../types';
import { toAppError } from './http';
import { getServiceClient } from './supabase';

const APNS_PROD_URL = 'https://api.push.apple.com/3/device';
const APNS_SANDBOX_URL = 'https://api.sandbox.push.apple.com/3/device';

export interface PushPayload {
  body: string;
  title: string;
}

export const sendPushToUser = async (env: EnvBindings, token: string, payload: PushPayload): Promise<void> => {
  if (env.APP_ENV === 'development') {
    void token;
    void payload;
    return;
  }
  const jwt = await buildApnsJwt(env);
  const endpoint = `${getApnsBase(env)}/${token}`;
  const response = await fetch(endpoint, {
    body: JSON.stringify({ aps: { alert: { body: payload.body, title: payload.title }, sound: 'default' } }),
    headers: {
      authorization: `bearer ${jwt}`,
      'apns-topic': env.APP_BUNDLE_ID,
      'content-type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw toAppError('APNS_SEND_FAILED', 'failed to send push', HTTP_INTERNAL_ERROR);
  }
};

export const pushToHousehold = async (
  env: EnvBindings,
  householdId: string,
  payload: PushPayload,
  excludeUserId?: string,
): Promise<void> => {
  const service = getServiceClient(env);
  let query = service.from('users').select('id, apns_token').eq('household_id', householdId);
  if (excludeUserId !== undefined) {
    query = query.neq('id', excludeUserId);
  }

  const users = await query;
  if (users.error !== null || users.data === null) {
    return;
  }

  for (const user of users.data) {
    if (user.apns_token === null) {
      continue;
    }
    await sendPushToUser(env, user.apns_token, payload);
  }
};

export const pushToUserId = async (env: EnvBindings, userId: string, payload: PushPayload): Promise<void> => {
  const service = getServiceClient(env);
  const user = await service.from('users').select('apns_token').eq('id', userId).maybeSingle();
  if (user.error !== null || user.data?.apns_token === null || user.data === null) {
    return;
  }
  await sendPushToUser(env, user.data.apns_token, payload);
};

const buildApnsJwt = async (env: EnvBindings): Promise<string> => {
  const key = await importPKCS8(env.APNS_PRIVATE_KEY, 'ES256');
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: env.APNS_KEY_ID })
    .setIssuer(env.APNS_TEAM_ID)
    .setIssuedAt()
    .sign(key);
};

const getApnsBase = (env: EnvBindings): string => {
  return env.APP_ENV === 'production' ? APNS_PROD_URL : APNS_SANDBOX_URL;
};
