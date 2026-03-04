create extension if not exists "pgcrypto";

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  plan text not null default 'trial' check (plan in ('trial', 'duo', 'family_s', 'family_m', 'family_l')),
  plan_expires_at timestamptz,
  trial_started_at timestamptz not null default now(),
  trial_expires_at timestamptz not null default (now() + interval '7 days'),
  is_active bool not null default true,
  lola_personality text not null default 'balanced' check (lola_personality in ('calm', 'balanced', 'sassy')),
  home_score int not null default 50 check (home_score between 0 and 100),
  score_above_90_since date,
  family_streak int not null default 0,
  family_ring_progress int not null default 0,
  streak_last_updated date,
  catchup_pending bool not null default false,
  monthly_challenge jsonb,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key references auth.users on delete cascade,
  household_id uuid references households(id) on delete set null,
  display_name text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  avatar_color text not null default '#7CB99A',
  avatar_emoji text,
  xp_total int not null default 0,
  ring_progress int not null default 0,
  last_seen_at timestamptz not null default now(),
  timezone text not null default 'UTC',
  apns_token text,
  created_at timestamptz not null default now()
);

create table if not exists lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  created_by uuid not null references users(id) on delete cascade,
  name text not null,
  list_type text not null default 'household' check (list_type in ('household', 'personal', 'project')),
  color text not null default '#7CB99A',
  emoji text,
  is_archived bool not null default false,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  assigned_to uuid references users(id) on delete set null,
  created_by uuid not null references users(id) on delete cascade,
  title text not null,
  category text not null default 'other' check (
    category in (
      'hygiene',
      'kitchen',
      'laundry',
      'tidying',
      'maintenance',
      'outdoor',
      'errands',
      'school',
      'work',
      'personal',
      'other'
    )
  ),
  recurrence_type text not null default 'weekly' check (recurrence_type in ('once', 'daily', 'weekly', 'monthly', 'every_n_days')),
  interval_days int,
  next_due date,
  last_completed_at timestamptz,
  effort_points int not null default 2 check (effort_points between 1 and 5),
  streak_count int not null default 0,
  reminder_time time,
  is_up_for_grabs bool not null default false,
  is_archived bool not null default false,
  created_at timestamptz not null default now()
);

create table if not exists completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  list_id uuid not null references lists(id) on delete cascade,
  completed_by uuid not null references users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  was_catchup bool not null default false,
  photo_url text,
  xp_awarded int not null default 0,
  effort_points int not null default 0
);

create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  completion_id uuid not null references completions(id) on delete cascade,
  liked_by uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (completion_id, liked_by)
);

create table if not exists feed_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'task_completed',
      'catchup_triggered',
      'catchup_completed',
      'streak_milestone',
      'streak_broken',
      'home_score_milestone',
      'weekly_recap',
      'member_joined',
      'badge_awarded',
      'ring_completed',
      'monthly_challenge_completed'
    )
  ),
  actor_id uuid references users(id) on delete set null,
  task_id uuid references tasks(id) on delete set null,
  completion_id uuid references completions(id) on delete set null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists lola_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  role text not null check (role in ('user', 'lola')),
  content text not null,
  actions jsonb,
  reply_to_id uuid references lola_messages(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  badge_key text not null,
  awarded_by text not null default 'lola',
  awarded_at timestamptz not null default now()
);

create table if not exists catchup_sessions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  triggered_by uuid not null references users(id) on delete cascade,
  mode text not null check (mode in ('triage', 'clear')),
  triggered_at timestamptz not null default now(),
  tasks_critical int not null default 0,
  tasks_flexible int not null default 0,
  tasks_skipped int not null default 0,
  ai_decisions jsonb not null default '[]'
);

create table if not exists weekly_recaps (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  week_ending date not null,
  summary text not null,
  nudge text not null,
  push_title text not null,
  push_body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_household on users(household_id);
create index if not exists idx_users_apns on users(apns_token) where apns_token is not null;
create index if not exists idx_lists_household on lists(household_id);
create index if not exists idx_tasks_list on tasks(list_id);
create index if not exists idx_tasks_household on tasks(household_id);
create index if not exists idx_tasks_assigned on tasks(assigned_to);
create index if not exists idx_tasks_next_due on tasks(next_due);
create index if not exists idx_tasks_grabs on tasks(is_up_for_grabs) where is_up_for_grabs = true;
create index if not exists idx_completions_household on completions(household_id);
create index if not exists idx_completions_by on completions(completed_by);
create index if not exists idx_completions_at on completions(completed_at desc);
create index if not exists idx_feed_household on feed_events(household_id);
create index if not exists idx_feed_created on feed_events(created_at desc);
create index if not exists idx_lola_messages_user on lola_messages(user_id);
create index if not exists idx_lola_messages_user_hh on lola_messages(user_id, household_id);
create index if not exists idx_lola_messages_created on lola_messages(created_at desc);
create index if not exists idx_badges_user on badges(user_id);
create index if not exists idx_likes_completion on likes(completion_id);
