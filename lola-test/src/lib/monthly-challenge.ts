import type { SupabaseClient } from '@supabase/supabase-js';

import { HOUSEHOLD, ONE, TEN, TWELVE } from '../constants';

interface ChallengeState {
  completed?: boolean;
  current_rate?: number;
  goal?: string;
  month?: string;
  target_completion_rate?: number;
}

export const refreshMonthlyChallengeProgress = async (
  service: SupabaseClient,
  householdId: string,
): Promise<void> => {
  const context = await getChallengeContext(service, householdId);
  if (context === null) {
    return;
  }

  const rate = await getChallengeRate(service, householdId, context.bounds, context.listIds);
  if (rate === null) {
    return;
  }

  const target = typeof context.challenge.target_completion_rate === 'number' ? context.challenge.target_completion_rate : ONE;
  const updated: ChallengeState = {
    ...context.challenge,
    completed: rate >= target,
    current_rate: Number(rate.toFixed(2)),
    month: context.month,
  };

  await service.from('households').update({ monthly_challenge: updated }).eq('id', householdId);
};

const getChallengeContext = async (
  service: SupabaseClient,
  householdId: string,
): Promise<{ bounds: { endDate: string; endIso: string; startDate: string; startIso: string }; challenge: ChallengeState; listIds: string[]; month: string } | null> => {
  const household = await service.from('households').select('monthly_challenge, timezone').eq('id', householdId).single();
  if (household.error !== null || household.data === null || household.data.monthly_challenge === null) {
    return null;
  }

  const challenge = household.data.monthly_challenge as ChallengeState;
  const month = challenge.month ?? monthKeyInTimezone(household.data.timezone);
  const bounds = monthBounds(month);
  if (bounds === null) {
    return null;
  }
  const listIds = await fetchHouseholdListIds(service, householdId);
  if (listIds.length === 0) {
    return null;
  }

  return { bounds, challenge, listIds, month };
};

const getChallengeRate = async (
  service: SupabaseClient,
  householdId: string,
  bounds: { endDate: string; endIso: string; startDate: string; startIso: string },
  listIds: string[],
): Promise<number | null> => {
  const [due, completions] = await Promise.all([
    service
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId)
      .eq('is_archived', false)
      .in('list_id', listIds)
      .gte('next_due', bounds.startDate)
      .lt('next_due', bounds.endDate),
    service
      .from('completions')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId)
      .in('list_id', listIds)
      .gte('completed_at', bounds.startIso)
      .lt('completed_at', bounds.endIso),
  ]);
  if (due.error !== null || completions.error !== null) {
    return null;
  }

  const dueCount = due.count ?? 0;
  const completionCount = completions.count ?? 0;
  return dueCount <= 0 ? 0 : Math.min(completionCount / dueCount, ONE);
};

const fetchHouseholdListIds = async (service: SupabaseClient, householdId: string): Promise<string[]> => {
  const lists = await service.from('lists').select('id').eq('household_id', householdId).eq('list_type', HOUSEHOLD);
  if (lists.error !== null || lists.data === null) {
    return [];
  }
  return lists.data.map((list) => list.id);
};

const monthKeyInTimezone = (timezone: string): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    timeZone: safeTimezone(timezone),
    year: 'numeric',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  return `${year}-${month}`;
};

const monthBounds = (monthKey: string): { endDate: string; endIso: string; startDate: string; startIso: string } | null => {
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < ONE || month > TWELVE) {
    return null;
  }

  const start = new Date(Date.UTC(year, month - ONE, ONE));
  const end = new Date(Date.UTC(year, month, ONE));
  return {
    endDate: end.toISOString().slice(0, TEN),
    endIso: end.toISOString(),
    startDate: start.toISOString().slice(0, TEN),
    startIso: start.toISOString(),
  };
};

const safeTimezone = (timezone: string): string => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return timezone;
  } catch {
    return 'UTC';
  }
};
