import { IMMACULATE_WINDOW_DAYS, MILLISECONDS_PER_DAY, NINETY, SEVEN } from '../constants';
import { daysAgoIso, startOfDayIso } from './dates';
import { getServiceClient } from './supabase';

export const hasTeamPlayerDay = async (
  service: ReturnType<typeof getServiceClient>,
  householdId: string,
  listIds: string[],
): Promise<boolean> => {
  if (listIds.length === 0) {
    return false;
  }

  const [members, completions] = await Promise.all([
    service.from('users').select('id').eq('household_id', householdId),
    service
      .from('completions')
      .select('completed_by')
      .eq('household_id', householdId)
      .in('list_id', listIds)
      .gte('completed_at', startOfDayIso()),
  ]);

  const memberRows = members.data ?? [];
  const completionRows = completions.data ?? [];
  if (memberRows.length === 0) {
    return false;
  }

  const completers = new Set(completionRows.map((item) => item.completed_by));
  return memberRows.every((member) => completers.has(member.id));
};

export const isHouseholdMvp = async (
  service: ReturnType<typeof getServiceClient>,
  householdId: string,
  userId: string,
  listIds: string[],
): Promise<boolean> => {
  if (listIds.length === 0) {
    return false;
  }

  const completions = await service
    .from('completions')
    .select('completed_by')
    .eq('household_id', householdId)
    .in('list_id', listIds)
    .gte('completed_at', daysAgoIso(SEVEN - 1));

  const rows = completions.data ?? [];
  if (rows.length === 0) {
    return false;
  }

  const counts = new Map<string, number>();
  rows.forEach((row) => counts.set(row.completed_by, (counts.get(row.completed_by) ?? 0) + 1));
  const top = Math.max(...counts.values());
  return (counts.get(userId) ?? 0) === top && top > 0;
};

export const isImmaculateEligible = (homeScore?: number, scoreAboveSince?: string | null): boolean => {
  if (homeScore === undefined || scoreAboveSince === undefined || scoreAboveSince === null || homeScore < NINETY) {
    return false;
  }
  const ageMs = Date.now() - Date.parse(`${scoreAboveSince}T00:00:00.000Z`);
  return ageMs >= IMMACULATE_WINDOW_DAYS * MILLISECONDS_PER_DAY;
};
