import { HTTP_FORBIDDEN, HTTP_PAYMENT_REQUIRED, MILLISECONDS_PER_DAY, SEVEN } from '../constants';
import { toAppError } from '../lib/http';
import { getUserClient, mustData } from '../lib/supabase';
import type { AppContext } from '../types';

export const entitlementMiddleware = async (ctx: AppContext, next: () => Promise<void>): Promise<void> => {
  const auth = ctx.get('auth');
  if (auth.householdId === null) {
    throw toAppError('NO_HOUSEHOLD', 'join or create a household first', HTTP_FORBIDDEN);
  }

  const client = getUserClient(ctx.env, auth.accessToken);
  const query = await client
    .from('households')
    .select('is_active, trial_started_at, timezone')
    .eq('id', auth.householdId)
    .maybeSingle();

  const household = mustData(query.data, query.error, 'HOUSEHOLD_LOOKUP_FAILED');
  if (!household.is_active && isTrialExpired(household.trial_started_at, household.timezone)) {
    throw toAppError('PLAN_LOCKED', 'subscription inactive', HTTP_PAYMENT_REQUIRED);
  }
  await next();
};

const isTrialExpired = (trialStartedAt: string, timezone: string): boolean => {
  const todayLocal = localDateKey(new Date(), timezone);
  const startLocal = localDateKey(new Date(trialStartedAt), timezone);
  return dateDiffDays(todayLocal, startLocal) >= SEVEN;
};

const localDateKey = (value: Date, timezone: string): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone: safeTimezone(timezone),
    year: 'numeric',
  }).formatToParts(value);
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
};

const dateDiffDays = (left: string, right: string): number => {
  const leftAt = Date.parse(`${left}T00:00:00.000Z`);
  const rightAt = Date.parse(`${right}T00:00:00.000Z`);
  return Math.floor((leftAt - rightAt) / MILLISECONDS_PER_DAY);
};

const safeTimezone = (timezone: string): string => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return timezone;
  } catch {
    return 'UTC';
  }
};
