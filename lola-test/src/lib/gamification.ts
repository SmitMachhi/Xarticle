import { dispatchDomainEvent } from '../agent/event-dispatch';
import { FIVE, ONE_HUNDRED, SEVEN } from '../constants';
import type { BadgeKey, EnvBindings } from '../types';
import { startOfDayIso } from './dates';
import { hasTeamPlayerDay, isHouseholdMvp, isImmaculateEligible } from './gamification-rules';
import { getServiceClient } from './supabase';

interface CompletionBadgeInput {
  householdId: string;
  newStreak: number;
  photoUrl?: string;
  userId: string;
}

const BADGE_TITLE: Record<BadgeKey, string> = {
  comeback_kid: 'comeback kid',
  family_first: 'family first',
  first_sweep: 'first sweep',
  household_mvp: 'household mvp',
  immaculate: 'immaculate',
  on_a_roll: 'on a roll',
  ring_master: 'ring master',
  show_off: 'show off',
  speed_run: 'speed run',
  team_player: 'team player',
};

export const processCompletionGamification = async (
  service: ReturnType<typeof getServiceClient>,
  input: CompletionBadgeInput,
  env: EnvBindings,
): Promise<void> => {
  const keys = await getCompletionBadgeCandidates(service, input);
  await Promise.all(keys.map((key) => awardBadgeIfMissing(service, input.householdId, input.userId, key, env)));
  await refreshFamilyRingProgress(service, input.householdId, env);
};

export const awardBadgeIfMissing = async (
  service: ReturnType<typeof getServiceClient>,
  householdId: string,
  userId: string,
  badgeKey: BadgeKey,
  env?: EnvBindings,
): Promise<void> => {
  const existing = await service
    .from('badges')
    .select('id')
    .eq('household_id', householdId)
    .eq('user_id', userId)
    .eq('badge_key', badgeKey)
    .maybeSingle();

  if (existing.error !== null || existing.data !== null) {
    return;
  }

  const user = await service.from('users').select('display_name, avatar_color').eq('id', userId).single();
  if (user.error !== null || user.data === null) {
    return;
  }

  await service.from('badges').insert({ badge_key: badgeKey, household_id: householdId, user_id: userId });
  await service.from('feed_events').insert({
    actor_id: userId,
    event_type: 'badge_awarded',
    household_id: householdId,
    payload: {
      badge_key: badgeKey,
      recipient_avatar_color: user.data.avatar_color,
      recipient_name: user.data.display_name,
    },
  });
  if (env !== undefined) {
    await dispatchDomainEvent({
      env,
      event: {
        actor_user_id: userId,
        audience_user_ids: [userId],
        facts: { badge_title: BADGE_TITLE[badgeKey] },
        household_id: householdId,
        type: 'badge_awarded',
      },
      service,
    });
  }
};

export const refreshFamilyRingProgress = async (
  service: ReturnType<typeof getServiceClient>,
  householdId: string,
  env?: EnvBindings,
): Promise<number> => {
  const firstDay = new Date();
  firstDay.setUTCDate(1);
  firstDay.setUTCHours(0, 0, 0, 0);
  const householdLists = await service.from('lists').select('id').eq('household_id', householdId).eq('list_type', 'household');
  if (householdLists.error !== null || householdLists.data === null || householdLists.data.length === 0) {
    await service.from('households').update({ family_ring_progress: 0 }).eq('id', householdId);
    return 0;
  }
  const listIds = householdLists.data.map((list) => list.id);
  const [users, completions] = await Promise.all([
    service.from('users').select('id').eq('household_id', householdId),
    service
      .from('completions')
      .select('completed_by')
      .eq('household_id', householdId)
      .in('list_id', listIds)
      .gte('completed_at', firstDay.toISOString()),
  ]);

  if (users.data === null || completions.data === null || users.data.length === 0) {
    return 0;
  }

  const doneBy = new Set(completions.data.map((item) => item.completed_by));
  const progress = Math.round((doneBy.size / users.data.length) * ONE_HUNDRED);
  await service.from('households').update({ family_ring_progress: progress }).eq('id', householdId);

  if (progress === ONE_HUNDRED) {
    await service.from('feed_events').insert({
      event_type: 'ring_completed',
      household_id: householdId,
      payload: { ring_type: 'family' },
    });
    await Promise.all(users.data.map((member) => awardBadgeIfMissing(service, householdId, member.id, 'family_first', env)));
  }
  return progress;
};

const getCompletionBadgeCandidates = async (
  service: ReturnType<typeof getServiceClient>,
  input: CompletionBadgeInput,
): Promise<BadgeKey[]> => {
  const [householdLists, totalCompletions, completionsToday, me, household] = await Promise.all([
    service.from('lists').select('id').eq('household_id', input.householdId).eq('list_type', 'household'),
    service.from('completions').select('id', { count: 'exact', head: true }).eq('completed_by', input.userId),
    service.from('completions').select('id', { count: 'exact', head: true }).eq('completed_by', input.userId).gte('completed_at', startOfDayIso()),
    service.from('users').select('ring_progress').eq('id', input.userId).single(),
    service.from('households').select('home_score, score_above_90_since').eq('id', input.householdId).single(),
  ]);

  const listIds = (householdLists.data ?? []).map((item) => item.id);
  const [teamPlayer, mvp] = await Promise.all([
    hasTeamPlayerDay(service, input.householdId, listIds),
    isHouseholdMvp(service, input.householdId, input.userId, listIds),
  ]);

  const candidates: Array<{ active: boolean; key: BadgeKey }> = [
    { active: (totalCompletions.count ?? 0) === 1, key: 'first_sweep' },
    { active: input.newStreak >= SEVEN, key: 'on_a_roll' },
    { active: (completionsToday.count ?? 0) >= FIVE, key: 'speed_run' },
    { active: input.photoUrl !== undefined && input.photoUrl.length > 0, key: 'show_off' },
    { active: me.data?.ring_progress === ONE_HUNDRED, key: 'ring_master' },
    { active: mvp, key: 'household_mvp' },
    { active: teamPlayer, key: 'team_player' },
    { active: isImmaculateEligible(household.data?.home_score, household.data?.score_above_90_since), key: 'immaculate' },
  ];
  return candidates.filter((item) => item.active).map((item) => item.key);
};
