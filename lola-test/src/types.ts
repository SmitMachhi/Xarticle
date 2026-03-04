import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import type {
  BADGE_KEYS,
  FEED_EVENT_TYPES,
  HOUSEHOLD_PERSONALITIES,
  LIST_TYPES,
  RECURRENCE_TYPES,
  SUBSCRIPTION_EVENTS,
  TASK_CATEGORIES,
  USER_ROLES,
} from './constants';

export type Plan = 'duo' | 'family_l' | 'family_m' | 'family_s' | 'trial';
export type UserRole = (typeof USER_ROLES)[number];
export type ListType = (typeof LIST_TYPES)[number];
export type TaskCategory = (typeof TASK_CATEGORIES)[number];
export type RecurrenceType = (typeof RECURRENCE_TYPES)[number];
export type FeedEventType = (typeof FEED_EVENT_TYPES)[number];
export type LolaPersonality = (typeof HOUSEHOLD_PERSONALITIES)[number];
export type BadgeKey = (typeof BADGE_KEYS)[number];
export type SubscriptionEvent = (typeof SUBSCRIPTION_EVENTS)[number];

export interface EnvBindings {
  AGENT_COPY_ENFORCEMENT_ENABLED: string;
  AGENT_EVENT_COPY_ENABLED: string;
  AGENT_REALIZER_ENABLED: string;
  APNS_KEY_ID: string;
  APNS_PRIVATE_KEY: string;
  APNS_TEAM_ID: string;
  APP_BUNDLE_ID: string;
  APP_ENV: string;
  INVITE_CODE_SALT: string;
  OPENROUTER_API_KEY: string;
  OPENROUTER_CHAT_MODEL: string;
  OPENROUTER_EDGE_JSON_MODEL: string;
  OPENROUTER_JSON_MODEL: string;
  OPENROUTER_MODEL: string;
  OPENROUTER_REASONING_EFFORT_JSON: string;
  REVENUECAT_WEBHOOK_SECRET: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_URL: string;
}

export interface AuthContext {
  accessToken: string;
  householdId: string | null;
  role: UserRole;
  userId: string;
}

export interface AppVariables {
  auth: AuthContext;
}

export type AppContext = Context<{ Bindings: EnvBindings; Variables: AppVariables }>;

export interface Household {
  catchup_pending: boolean;
  created_at: string;
  family_ring_progress: number;
  family_streak: number;
  home_score: number;
  id: string;
  invite_code: string;
  is_active: boolean;
  lola_personality: LolaPersonality;
  monthly_challenge: Record<string, unknown> | null;
  name: string;
  plan: Plan;
  plan_expires_at: string | null;
  score_above_90_since: string | null;
  timezone: string;
  trial_expires_at: string;
}

export interface UserRow {
  apns_token: string | null;
  avatar_color: string;
  avatar_emoji: string | null;
  created_at: string;
  display_name: string;
  household_id: string | null;
  id: string;
  last_seen_at: string;
  ring_progress: number;
  role: UserRole;
  timezone: string;
  xp_total: number;
}

export interface ListRow {
  color: string;
  created_at: string;
  created_by: string;
  emoji: string | null;
  household_id: string;
  id: string;
  is_archived: boolean;
  list_type: ListType;
  name: string;
}

export interface TaskRow {
  assigned_to: string | null;
  category: TaskCategory;
  created_at: string;
  created_by: string;
  effort_points: number;
  household_id: string;
  id: string;
  interval_days: number | null;
  is_archived: boolean;
  is_up_for_grabs: boolean;
  last_completed_at: string | null;
  list_id: string;
  next_due: string | null;
  recurrence_type: RecurrenceType;
  reminder_time: string | null;
  streak_count: number;
  title: string;
}

export interface LolaAction {
  action: string;
  label: string;
  requires_role: UserRole;
}

export interface LolaMessage {
  actions: LolaAction[] | null;
  content: string;
  created_at: string;
  household_id: string;
  id: string;
  reply_to_id: string | null;
  role: 'lola' | 'user';
  user_id: string;
}

export interface FeedEvent {
  actor_id: string | null;
  completion_id: string | null;
  created_at: string;
  event_type: FeedEventType;
  household_id: string;
  id: string;
  payload: Record<string, unknown>;
  task_id: string | null;
}

export interface PaginationQuery {
  before?: string;
  limit?: number;
}

export interface OpenRouterMessage {
  content: string;
  role: 'assistant' | 'system' | 'tool' | 'user';
  tool_calls?: Array<{
    function: { arguments: string; name: string };
    id: string;
    type: 'function';
  }>;
  tool_call_id?: string;
}

export interface ToolCall {
  arguments: Record<string, unknown>;
  id: string;
  name: string;
}

export interface ToolResult {
  content: string;
  tool_call_id: string;
}

export interface AppError {
  code: string;
  message: string;
  status: ContentfulStatusCode;
}
