import { SEVEN, STORAGE_MEMORY_PATH, TWENTY } from '../constants';
import { getServiceClient, mustData } from '../lib/supabase';
import type { EnvBindings, OpenRouterMessage, UserRow } from '../types';
import { formatChallenge, formatHouseholdTaskList, formatTaskList, scoreLabel } from './context-render';
import { buildDecisionState } from './decision-context';
import { buildSoulPrompt } from './prompts/soul';
export interface AssembledContext {
  householdName: string;
  messages: OpenRouterMessage[];
  personality: 'balanced' | 'calm' | 'sassy';
  recentAssistantTexts: string[];
  userHistoryCount: number;
}
export const assembleContext = async (env: EnvBindings, userId: string): Promise<AssembledContext> => {
  const service = getServiceClient(env);
  const userQuery = await service.from('users').select('*').eq('id', userId).single();
  const user = mustData(userQuery.data as UserRow | null, userQuery.error, 'USER_FETCH_FAILED');
  if (user.household_id === null) {
    return {
      householdName: 'no household',
      messages: [{ content: 'User has no household.', role: 'system' }],
      personality: 'balanced',
      recentAssistantTexts: [],
      userHistoryCount: 0,
    };
  }
  const data = await loadHouseholdContext(service, user.household_id, userId);
  const adminName = data.members.find((member) => member.role === 'admin')?.display_name ?? null;
  const soul = buildSoulPrompt({
    adminName,
    householdName: data.household.name,
    personality: data.household.lola_personality as 'balanced' | 'calm' | 'sassy',
    role: user.role,
    userName: user.display_name,
  });
  const memory = await loadMemory(env, userId);
  const recentAssistantTexts = data.history.filter((message) => message.role === 'lola').map((message) => message.content);
  const messages: OpenRouterMessage[] = [
    { content: soul, role: 'system' },
    { content: buildUserState(user, data.tasks, data.listMap, data.badges.map((badge) => badge.badge_key), data.completionsThisWeek), role: 'system' },
    { content: buildHouseholdState(data.household, data.members, data.tasks, data.listMap), role: 'system' },
    { content: buildDecisionState(user, data.household, data.tasks, data.listMap, recentAssistantTexts), role: 'system' },
    { content: memory, role: 'system' },
    ...data.history.map((message) => {
      const role: OpenRouterMessage['role'] = message.role === 'lola' ? 'assistant' : 'user';
      return { content: message.content, role };
    }),
  ];
  return {
    householdName: data.household.name,
    messages,
    personality: data.household.lola_personality as 'balanced' | 'calm' | 'sassy',
    recentAssistantTexts,
    userHistoryCount: data.history.length,
  };
};
type ContextList = { id: string; list_type: string; name: string };
type ContextMember = { display_name: string; id: string; ring_progress: number; role: string };
type ContextHousehold = {
  catchup_pending: boolean;
  family_streak: number;
  home_score: number;
  monthly_challenge: unknown;
  name: string;
  plan: string;
};
type ContextTask = {
  assigned_to: string | null;
  effort_points: number;
  list_id: string;
  next_due: string | null;
  streak_count: number;
  title: string;
};
const loadHouseholdContext = async (
  service: ReturnType<typeof getServiceClient>,
  householdId: string,
  userId: string,
): Promise<{
  badges: Array<{ badge_key: string }>;
  completionsThisWeek: number;
  history: Array<{ content: string; created_at: string; role: 'lola' | 'user' }>;
  household: ContextHousehold & { lola_personality: string };
  listMap: Map<string, ContextList>;
  members: ContextMember[];
  tasks: ContextTask[];
}> => {
  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - (SEVEN - 1));
  weekStart.setUTCHours(0, 0, 0, 0);
  const [householdQuery, membersQuery, tasksQuery, listsQuery, badgesQuery, completionsThisWeekQuery, historyQuery] = await Promise.all([
    service.from('households').select('*').eq('id', householdId).single(),
    service.from('users').select('id, display_name, role, ring_progress').eq('household_id', householdId),
    service.from('tasks').select('title, next_due, assigned_to, effort_points, streak_count, list_id').eq('household_id', householdId).eq('is_archived', false),
    service.from('lists').select('id, name, list_type').eq('household_id', householdId),
    service.from('badges').select('badge_key').eq('user_id', userId),
    service.from('completions').select('id', { count: 'exact', head: true }).eq('household_id', householdId).eq('completed_by', userId).gte('completed_at', weekStart.toISOString()),
    service.from('lola_messages').select('role, content, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(TWENTY),
  ]);
  const lists = mustData(listsQuery.data, listsQuery.error, 'LISTS_FETCH_FAILED');
  return {
    badges: mustData(badgesQuery.data, badgesQuery.error, 'BADGES_FETCH_FAILED'),
    completionsThisWeek: completionsThisWeekQuery.count ?? 0,
    history: mustData(historyQuery.data, historyQuery.error, 'LOLA_HISTORY_FETCH_FAILED').reverse(),
    household: mustData(householdQuery.data, householdQuery.error, 'HOUSEHOLD_FETCH_FAILED'),
    listMap: new Map(lists.map((list) => [list.id, list])),
    members: mustData(membersQuery.data, membersQuery.error, 'MEMBERS_FETCH_FAILED'),
    tasks: mustData(tasksQuery.data, tasksQuery.error, 'TASKS_FETCH_FAILED'),
  };
};
const buildUserState = (
  user: UserRow,
  tasks: ContextTask[],
  listMap: Map<string, ContextList>,
  badges: string[],
  completionsThisWeek: number,
): string => {
  const mine = tasks.filter((task) => task.assigned_to === user.id);
  const householdTasks = mine.filter((task) => listMap.get(task.list_id)?.list_type === 'household');
  const personalOrProject = mine.filter((task) => listMap.get(task.list_id)?.list_type !== 'household');
  const streaks = mine.filter((task) => task.streak_count > 0);
  return [
    `USER.md`,
    `User: ${user.display_name}`,
    `Role: ${user.role}`,
    `Timezone: ${user.timezone}`,
    `XP hidden: ${user.xp_total}`,
    `Ring: ${user.ring_progress}/100`,
    `Badges: ${badges.join(', ') || 'none'}`,
    `Your completions this week: ${completionsThisWeek}`,
    `Household tasks: ${formatTaskList(householdTasks)}`,
    `Personal/project tasks: ${formatTaskList(personalOrProject)}`,
    `Your current task streaks: ${streaks.map((task) => `${task.title} (${task.streak_count})`).join('; ') || 'none'}`,
  ].join('\n');
};
const buildHouseholdState = (
  household: ContextHousehold,
  members: ContextMember[],
  tasks: ContextTask[],
  listMap: Map<string, ContextList>,
): string => {
  const score = household.home_score;
  const challenge = formatChallenge(household.monthly_challenge);
  const householdTasks = tasks.filter((task) => listMap.get(task.list_id)?.list_type === 'household');
  const memberNamesById = new Map(members.map((member) => [member.id, member.display_name]));
  return [
    `HOUSEHOLD.md`,
    `Household: ${household.name}`,
    `Plan: ${household.plan}`,
    `Home Score: ${score} — ${scoreLabel(score)}`,
    `Family Streak: ${household.family_streak} days`,
    `Catch-up pending: ${household.catchup_pending}`,
    `Monthly challenge: ${challenge}`,
    `Members: ${members.map((member) => `${member.display_name} (${member.role}) ring=${member.ring_progress}`).join(', ')}`,
    `Household task count: ${householdTasks.length}`,
    `All active tasks: ${formatHouseholdTaskList(householdTasks, memberNamesById)}`,
  ].join('\n');
};
const loadMemory = async (env: EnvBindings, userId: string): Promise<string> => {
  const service = getServiceClient(env);
  const file = await service.storage.from(STORAGE_MEMORY_PATH).download(`${userId}/memory.md`);
  if (file.error !== null || file.data === null) {
    return 'MEMORY.md\nNo prior compaction.';
  }
  return await file.data.text();
};
