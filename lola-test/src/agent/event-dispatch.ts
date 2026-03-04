import type { SupabaseClient } from '@supabase/supabase-js';

import { pushToHousehold, pushToUserId } from '../lib/apns';
import type { EnvBindings, LolaPersonality } from '../types';
import {
  type DeliveryDecision,
  deliveryDecisionSchema,
  type DomainEvent,
  domainEventSchema,
  type SpeechAct,
} from './contracts';
import { buildRunPolicy, shouldUseEventCopy } from './copy-policy';
import { FALLBACK_COPY } from './fallback-copy';
import { realizeText } from './realizer';

interface DispatchInput {
  env: EnvBindings;
  event: DomainEvent;
  service: SupabaseClient;
}

const RECENT_ASSISTANT_LIMIT = 8;

export const dispatchDomainEvent = async (input: DispatchInput): Promise<void> => {
  const event = domainEventSchema.parse(input.event);
  const decision = decideDelivery(event);
  if (decision.silent) {
    return;
  }

  const personality = await loadPersonality(input.service, event.household_id);
  const speechAct = buildSpeechAct(event, personality);
  const chatText = await realizeChannelText(input.env, 'chat', speechAct, event, input.service, decision.chat_user_ids);
  if (decision.chat_user_ids.length > 0) {
    await insertChatMessages(input.service, event.household_id, decision.chat_user_ids, chatText, decision.actions);
  }

  if (decision.push_household || decision.push_user_ids.length > 0) {
    const pushBody = await realizeChannelText(input.env, 'push', speechAct, event, input.service, decision.push_user_ids);
    const payload = { body: pushBody, title: pushTitle(event.type) };
    if (decision.push_household) {
      await pushToHousehold(input.env, event.household_id, payload, decision.push_exclude_user_id ?? undefined).catch(() => undefined);
    }
    for (const userId of decision.push_user_ids) {
      await pushToUserId(input.env, userId, payload).catch(() => undefined);
    }
  }
};

const decideDelivery = (event: DomainEvent): DeliveryDecision => {
  const audience = event.audience_user_ids ?? (event.actor_user_id === undefined ? [] : [event.actor_user_id]);
  const base = { actions: [], chat_user_ids: [], push_exclude_user_id: null, push_household: false, push_user_ids: [], silent: false };
  const patch = DELIVERY_PATCH_BY_TYPE[event.type](event, audience);
  return deliveryDecisionSchema.parse({ ...base, ...patch });
};

const buildSpeechAct = (event: DomainEvent, tone: LolaPersonality): SpeechAct => {
  return {
    audience: event.type.includes('admin') ? 'admin' : 'user',
    constraints: ['Keep it concise.', 'Avoid guilt or pressure.', 'Never mention internal runtime state.'],
    facts: event.facts,
    intent: event.type,
    tone,
  };
};

const realizeChannelText = async (
  env: EnvBindings,
  channel: 'chat' | 'push',
  speechAct: SpeechAct,
  event: DomainEvent,
  service: SupabaseClient,
  userIds: string[],
): Promise<string> => {
  if (!shouldUseEventCopy(env)) {
    return channel === 'chat' ? FALLBACK_COPY.EVENT_CHAT : FALLBACK_COPY.EVENT_PUSH_BODY;
  }
  const policy = buildRunPolicy(speechAct.tone, channel);
  return await realizeText(env, {
    draft: eventDraft(event),
    policy,
    recentAssistantTexts: await loadRecentAssistantTexts(service, userIds),
    speechAct,
  }).catch(() => (channel === 'chat' ? FALLBACK_COPY.EVENT_CHAT : FALLBACK_COPY.EVENT_PUSH_BODY));
};

const eventDraft = (event: DomainEvent): string => {
  return EVENT_DRAFT_BY_TYPE[event.type](event);
};

const pushTitle = (type: DomainEvent['type']): string => {
  if (type === 'badge_awarded') {
    return 'Badge awarded';
  }
  if (type === 'catchup_prompt') {
    return 'Catch-up pending';
  }
  if (type === 'member_joined') {
    return 'Member joined';
  }
  if (type === 'task_assigned') {
    return 'Task assigned';
  }
  if (type === 'task_completed') {
    return 'Task completed';
  }
  if (type === 'weekly_recap') {
    return 'Weekly recap';
  }
  return FALLBACK_COPY.EVENT_PUSH_TITLE;
};

const insertChatMessages = async (
  service: SupabaseClient,
  householdId: string,
  userIds: string[],
  content: string,
  actions: DeliveryDecision['actions'],
): Promise<void> => {
  if (userIds.length === 0) {
    return;
  }
  await service.from('lola_messages').insert(
    userIds.map((id) => ({
      actions: actions.length > 0 ? actions : null,
      content,
      household_id: householdId,
      role: 'lola',
      user_id: id,
    })),
  );
};

const loadPersonality = async (service: SupabaseClient, householdId: string): Promise<LolaPersonality> => {
  const household = await service.from('households').select('lola_personality').eq('id', householdId).maybeSingle();
  return (household.data?.lola_personality as LolaPersonality | undefined) ?? 'balanced';
};

const loadRecentAssistantTexts = async (service: SupabaseClient, userIds: string[]): Promise<string[]> => {
  if (userIds.length === 0) {
    return [];
  }
  const messages = await service
    .from('lola_messages')
    .select('content')
    .in('user_id', userIds)
    .eq('role', 'lola')
    .order('created_at', { ascending: false })
    .limit(RECENT_ASSISTANT_LIMIT);
  if (messages.error !== null || messages.data === null) {
    return [];
  }
  return messages.data.map((item) => item.content);
};

const DELIVERY_PATCH_BY_TYPE: Record<
  DomainEvent['type'],
  (_event: DomainEvent, _audience: string[]) => Partial<DeliveryDecision>
> = {
  badge_awarded: (_event, audience) => ({ chat_user_ids: audience, push_user_ids: audience }),
  catchup_prompt: (event, audience) => ({ actions: event.actions ?? [], chat_user_ids: audience, push_user_ids: audience }),
  household_created: (_event, audience) => ({ chat_user_ids: audience }),
  list_type_changed: (_event, audience) => ({ chat_user_ids: audience }),
  member_joined: (event, audience) => ({ chat_user_ids: audience, push_exclude_user_id: event.actor_user_id ?? null, push_household: true }),
  streak_admin_prompt: (event, audience) => ({ actions: event.actions ?? [], chat_user_ids: audience }),
  streak_warning: (_event, audience) => ({ chat_user_ids: audience }),
  task_assigned: (_event, audience) => ({ push_user_ids: audience }),
  task_completed: (_event, audience) => ({ push_user_ids: audience }),
  weekly_recap: () => ({ push_household: true }),
};

const EVENT_DRAFT_BY_TYPE: Record<DomainEvent['type'], (_event: DomainEvent) => string> = {
  badge_awarded: (event) => `Celebrate badge ${String(event.facts.badge_title ?? 'earned')}.`,
  catchup_prompt: () => 'Ask the admin to choose a catch-up mode for the backlog.',
  household_created: (event) => `Welcome the user to household ${String(event.facts.household_name ?? 'home')}.`,
  list_type_changed: (event) => `List type changed to ${String(event.facts.list_type ?? 'household')}.`,
  member_joined: (event) => `${String(event.facts.member_name ?? 'A member')} joined the household.`,
  streak_admin_prompt: () => 'Ask the admin whether to protect the streak for this miss.',
  streak_warning: () => 'Remind members that today can protect the family streak.',
  task_assigned: (event) => `Tell the assignee that task ${String(event.facts.task_title ?? 'task')} is theirs.`,
  task_completed: (event) => `Celebrate completion of ${String(event.facts.task_title ?? 'a task')} by ${String(event.facts.actor_name ?? 'someone')}.`,
  weekly_recap: (event) => String(event.facts.summary ?? 'Share a short weekly recap.'),
};
