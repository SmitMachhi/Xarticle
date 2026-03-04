export const API_BASE = '/';

export const ONE = 1;
export const TWO = 2;
export const THREE = 3;
export const FOUR = 4;
export const FIVE = 5;
export const SIX = 6;
export const SEVEN = 7;
export const EIGHT = 8;
export const NINE = 9;
export const TEN = 10;
export const ELEVEN = 11;
export const TWELVE = 12;
export const FOURTEEN = 14;
export const TWENTY = 20;
export const TWENTY_ONE = 21;
export const THIRTY = 30;
export const FIFTY = 50;
export const SIXTY = 60;
export const NINETY = 90;
export const ONE_HUNDRED = 100;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_PAYMENT_REQUIRED = 402;
export const HTTP_FORBIDDEN = 403;
export const HTTP_NOT_FOUND = 404;
export const HTTP_CONFLICT = 409;
export const HTTP_TOO_MANY_REQUESTS = 429;
export const HTTP_INTERNAL_ERROR = 500;

export const MIN_SCORE = 10;
export const DEFAULT_HOME_SCORE = 50;
export const SCORE_LABEL_TRACK = 40;
export const SCORE_LABEL_GREAT = 75;
export const SCORE_LABEL_GOLD = 90;
export const RING_DIVISOR = 5;
export const RING_GAIN_CAP = 10;
export const STREAK_CAP = 14;
export const SCORE_WEIGHT_COMPLETION = 0.4;
export const SCORE_WEIGHT_STREAK = 0.35;
export const SCORE_WEIGHT_COVERAGE = 0.25;

export const RATE_LIMIT_MESSAGES = 10;
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const AGENT_MAX_ITERATIONS = 25;
export const AGENT_TIMEOUT_MS = 120_000;
export const AGENT_LOOP_TIMEOUT_MS = 300_000;
export const CONTEXT_WINDOW_SOFT_LIMIT = 80_000;
export const MAX_TOOL_RESULT_CHARS = 8_000;
export const MILLISECONDS_PER_DAY = 86_400_000;
export const MEMORY_MAX_CHARS = 8_000;
export const COMPACTION_CHAR_THRESHOLD = 40_000;

export const DEFAULT_INVITE_SIZE = 6;
export const FEED_DEFAULT_LIMIT = 30;
export const MESSAGES_DEFAULT_LIMIT = 50;
export const HISTORY_DEFAULT_DAYS = 90;
export const HISTORY_MAX_DAYS = 365;
export const SCORE_WINDOW_DAYS = 7;
export const COVERAGE_WINDOW_DAYS = 14;
export const IMMACULATE_WINDOW_DAYS = 30;

export const PLAN_MEMBER_LIMITS = {
  duo: TWO,
  family_l: EIGHT,
  family_m: SIX,
  family_s: FOUR,
  trial: TWO,
} as const;

export const PLAN_PRODUCT_MAP = {
  lola_duo_annual: 'duo',
  lola_duo_monthly: 'duo',
  lola_family_l_annual: 'family_l',
  lola_family_l_monthly: 'family_l',
  lola_family_m_annual: 'family_m',
  lola_family_m_monthly: 'family_m',
  lola_family_s_annual: 'family_s',
  lola_family_s_monthly: 'family_s',
} as const;

export const TASK_CATEGORIES = [
  'errands',
  'hygiene',
  'kitchen',
  'laundry',
  'maintenance',
  'other',
  'outdoor',
  'personal',
  'school',
  'tidying',
  'work',
] as const;

export const RECURRENCE_TYPES = ['daily', 'every_n_days', 'monthly', 'once', 'weekly'] as const;
export const LIST_TYPES = ['household', 'personal', 'project'] as const;
export const HOUSEHOLD_PERSONALITIES = ['balanced', 'calm', 'sassy'] as const;
export const USER_ROLES = ['admin', 'member'] as const;

export const FEED_EVENT_TYPES = [
  'badge_awarded',
  'catchup_completed',
  'catchup_triggered',
  'home_score_milestone',
  'member_joined',
  'monthly_challenge_completed',
  'ring_completed',
  'streak_broken',
  'streak_milestone',
  'task_completed',
  'weekly_recap',
] as const;

export const BADGE_KEYS = [
  'comeback_kid',
  'family_first',
  'first_sweep',
  'household_mvp',
  'immaculate',
  'on_a_roll',
  'ring_master',
  'show_off',
  'speed_run',
  'team_player',
] as const;

export const SUBSCRIPTION_EVENTS = ['CANCELLATION', 'EXPIRATION', 'INITIAL_PURCHASE', 'RENEWAL'] as const;

export const DEFAULT_AVATAR_COLOR = '#7CB99A';
export const DEFAULT_LIST_COLOR = '#7CB99A';
export const DEFAULT_TIMEZONE = 'UTC';
export const DEFAULT_PLAN = 'trial';
export const DEFAULT_LOLA_PERSONALITY = 'balanced';

export const SSE_EVENT_DELTA = 'delta';
export const SSE_EVENT_DONE = 'done';

export const STORAGE_MEMORY_PATH = 'lola-memory';
export const STORAGE_TRANSCRIPT_PATH = 'lola-transcripts';

export const DAILY = 'daily';
export const MONTHLY = 'monthly';
export const WEEKLY = 'weekly';
export const EVERY_N_DAYS = 'every_n_days';
export const ONCE = 'once';

export const HOUSEHOLD = 'household';
export const PERSONAL = 'personal';
export const PROJECT = 'project';

export const ROLE_ADMIN = 'admin';
export const ROLE_MEMBER = 'member';
