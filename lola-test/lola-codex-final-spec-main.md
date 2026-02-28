# 🧹 Lola — Complete Backend Spec
### Codex One-Shot Build Document · v3.0 · February 2026
**Stack:** Cloudflare Workers (Hono) · Supabase · Kimi K2.5 via OpenRouter · APNs · RevenueCat + Supawall

---

## INSTRUCTIONS FOR CODEX

You are building the complete backend for **Lola** — an agentic family life organizer. Lola is Accord (the Swedish family chore app) with an AI agent named Lola on top. Every UI decision copies Accord. Every agentic decision follows the OpenClaw architecture pattern.

This document contains every decision already made. Build exactly what is described. Do not ask clarifying questions. Do not add features not described here. Do not remove features that are described here.

**What you are building:**
- Hono API on Cloudflare Workers (TypeScript)
- Supabase schema, RLS policies, Realtime config
- Lola agent — OpenClaw pattern, Kimi K2.5 via OpenRouter, per-user private chat
- Lane Queue for serialized per-user message processing
- Context assembly engine (SOUL + USER + HOUSEHOLD + MEMORY files per user)
- APNs push notification sender
- RevenueCat webhook handler
- Supabase Edge Function cron jobs

**What you are NOT building:**
- iOS frontend
- Any web frontend
- Payment processing (RevenueCat handles this entirely)

---

## 1. Product Overview

Lola is a family life organizer. Chores are the anchor use case but lists can be anything — school projects, errands, home renovation, vacation planning. The app is Accord's UI with Lola as a private AI assistant per user sitting on top.

**Core philosophy (copied from Accord):**
- Make invisible labor visible
- Appreciation over punishment — never guilt
- Cooperative not competitive
- Relationship harmony through visibility

**What Lola adds on top of Accord:**
- Private AI assistant per user (Lola chat tab)
- AI-generated starter task list on onboarding
- Catch-Up Mode — AI triage when life gets ahead of you
- Natural language task creation through Lola
- Smart per-user proactive nudges
- Weekly AI recap in the shared feed
- Badges awarded by Lola based on XP thresholds

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| API runtime | Cloudflare Workers |
| API framework | Hono (TypeScript) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| File storage | Supabase Storage |
| AI model | Kimi K2.5 via OpenRouter |
| Push notifications | APNs (HTTP/2, JWT auth) |
| Payments | RevenueCat (webhook only) |
| Paywall A/B testing | Supawall |
| No code in spec | Confirmed |

---

## 3. Pricing & Entitlements

| Plan | Members | Monthly | Annual |
|---|---|---|---|
| Duo | 2 members | $14/mo | $84/yr |
| Family S | up to 4 | $22/mo | $132/yr |
| Family M | up to 6 | $30/mo | $180/yr |
| Family L | up to 8 | $38/mo | $228/yr |

- No free tier. No permanent free plan.
- 7-day free trial, card required upfront via RevenueCat + Supawall
- Trial locks hard at midnight on day 7 in user's local timezone
- All features fully unlocked during trial
- All list colors included in all paid plans
- Downgrade is manual — admin changes plan themselves, no auto-downgrade in v1

**RevenueCat product IDs:**
- `lola_duo_monthly` / `lola_duo_annual`
- `lola_family_s_monthly` / `lola_family_s_annual`
- `lola_family_m_monthly` / `lola_family_m_annual`
- `lola_family_l_monthly` / `lola_family_l_annual`

**Member limits enforced server-side:**

| Plan | Max members |
|---|---|
| Duo | 2 |
| Family S | 4 |
| Family M | 6 |
| Family L | 8 |

**Trial expiry behavior:**
- All members locked out simultaneously at midnight day 7 (user's local timezone)
- Admin sees full paywall to resubscribe
- Non-admin members see "waiting for [admin name] to resubscribe" screen
- No read access, no write access, complete lock

---

## 4. Database Schema

```sql
-- ─────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- HOUSEHOLDS
-- ─────────────────────────────────────────────────────────────
create table households (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  invite_code             text unique not null,
  plan                    text not null default 'trial'
                            check (plan in ('trial','duo','family_s','family_m','family_l')),
  plan_expires_at         timestamptz,
  trial_started_at        timestamptz not null default now(),
  trial_expires_at        timestamptz not null default (now() + interval '7 days'),
  is_active               bool not null default true,
  lola_personality        text not null default 'balanced'
                            check (lola_personality in ('calm','balanced','sassy')),
  home_score              int not null default 50
                            check (home_score between 0 and 100),
  family_streak           int not null default 0,
  family_ring_progress    int not null default 0,
  streak_last_updated     date,
  catchup_pending         bool not null default false,
  monthly_challenge       jsonb,
  timezone                text not null default 'UTC',
  created_at              timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────
create table users (
  id                uuid primary key references auth.users on delete cascade,
  household_id      uuid references households(id) on delete set null,
  display_name      text not null,
  role              text not null default 'member'
                      check (role in ('admin','member')),
  avatar_color      text not null default '#7CB99A',
  avatar_emoji      text,
  xp_total          int not null default 0,
  ring_progress     int not null default 0,
  last_seen_at      timestamptz not null default now(),
  timezone          text not null default 'UTC',
  apns_token        text,
  created_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- LISTS
-- Three types: household (gamified), personal (private), project (collaborative)
-- Gamification and catch-up only apply to household lists
-- ─────────────────────────────────────────────────────────────
create table lists (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households(id) on delete cascade,
  created_by      uuid not null references users(id) on delete cascade,
  name            text not null,
  list_type       text not null default 'household'
                    check (list_type in ('household','personal','project')),
  color           text not null default '#7CB99A',
  emoji           text,
  is_archived     bool not null default false,
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────────────────────────
create table tasks (
  id                uuid primary key default gen_random_uuid(),
  list_id           uuid not null references lists(id) on delete cascade,
  household_id      uuid not null references households(id) on delete cascade,
  assigned_to       uuid references users(id) on delete set null,
  created_by        uuid not null references users(id) on delete cascade,
  title             text not null,
  category          text not null default 'other'
                      check (category in (
                        'hygiene','kitchen','laundry','tidying',
                        'maintenance','outdoor','errands','school',
                        'work','personal','other'
                      )),
  recurrence_type   text not null default 'weekly'
                      check (recurrence_type in (
                        'once','daily','weekly','monthly','every_n_days'
                      )),
  interval_days     int,
  next_due          date,
  last_completed_at timestamptz,
  effort_points     int not null default 2
                      check (effort_points between 1 and 5),
  streak_count      int not null default 0,
  reminder_time     time,
  is_up_for_grabs   bool not null default false,
  is_archived       bool not null default false,
  created_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- COMPLETIONS
-- Permanent log. Never deleted.
-- ─────────────────────────────────────────────────────────────
create table completions (
  id              uuid primary key default gen_random_uuid(),
  task_id         uuid not null references tasks(id) on delete cascade,
  household_id    uuid not null references households(id) on delete cascade,
  list_id         uuid not null references lists(id) on delete cascade,
  completed_by    uuid not null references users(id) on delete cascade,
  completed_at    timestamptz not null default now(),
  was_catchup     bool not null default false,
  photo_url       text,
  xp_awarded      int not null default 0,
  effort_points   int not null default 0
);

-- ─────────────────────────────────────────────────────────────
-- LIKES
-- Family members can like completions (copy Accord)
-- ─────────────────────────────────────────────────────────────
create table likes (
  id              uuid primary key default gen_random_uuid(),
  completion_id   uuid not null references completions(id) on delete cascade,
  liked_by        uuid not null references users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique(completion_id, liked_by)
);

-- ─────────────────────────────────────────────────────────────
-- FEED EVENTS
-- Shared household activity stream (visible to all members)
-- ─────────────────────────────────────────────────────────────
create table feed_events (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households(id) on delete cascade,
  event_type      text not null check (event_type in (
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
                  )),
  actor_id        uuid references users(id) on delete set null,
  task_id         uuid references tasks(id) on delete set null,
  completion_id   uuid references completions(id) on delete set null,
  payload         jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- LOLA MESSAGES
-- Private per-user conversation with Lola
-- Scoped to user_id — each user has their own private chat
-- ─────────────────────────────────────────────────────────────
create table lola_messages (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  household_id    uuid not null references households(id) on delete cascade,
  role            text not null check (role in ('user','lola')),
  content         text not null,
  actions         jsonb,
  reply_to_id     uuid references lola_messages(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- actions jsonb shape when present:
-- [{ "label": "Sort it out", "action": "catchup_triage", "requires_role": "admin" },
--  { "label": "Fresh start", "action": "catchup_clear", "requires_role": "admin" }]
-- once any action is tapped: { "resolved": true, "resolved_by": "user_id", "resolved_action": "catchup_triage" }

-- ─────────────────────────────────────────────────────────────
-- BADGES
-- ─────────────────────────────────────────────────────────────
create table badges (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  household_id    uuid not null references households(id) on delete cascade,
  badge_key       text not null,
  awarded_by      text not null default 'lola',
  awarded_at      timestamptz not null default now()
);

-- badge_key values (XP thresholds in backend, names TBD by designer):
-- 'first_sweep'       — complete first task
-- 'on_a_roll'         — 7-day streak on any task
-- 'household_mvp'     — most completions in a week
-- 'team_player'       — whole household completes all tasks same day
-- 'comeback_kid'      — used catch-up mode successfully
-- 'immaculate'        — home score 90+ for 30 days
-- 'show_off'          — first photo completion
-- 'speed_run'         — complete 5 tasks in one day
-- 'ring_master'       — personal ring completed for first time
-- 'family_first'      — family ring completed for first time

-- ─────────────────────────────────────────────────────────────
-- CATCHUP SESSIONS
-- ─────────────────────────────────────────────────────────────
create table catchup_sessions (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households(id) on delete cascade,
  triggered_by    uuid not null references users(id) on delete cascade,
  mode            text not null check (mode in ('triage','clear')),
  triggered_at    timestamptz not null default now(),
  tasks_critical  int not null default 0,
  tasks_flexible  int not null default 0,
  tasks_skipped   int not null default 0,
  ai_decisions    jsonb not null default '[]'
);

-- ─────────────────────────────────────────────────────────────
-- WEEKLY RECAPS
-- ─────────────────────────────────────────────────────────────
create table weekly_recaps (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households(id) on delete cascade,
  week_ending     date not null,
  summary         text not null,
  nudge           text not null,
  push_title      text not null,
  push_body       text not null,
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────
create index idx_users_household         on users(household_id);
create index idx_users_apns              on users(apns_token) where apns_token is not null;
create index idx_lists_household         on lists(household_id);
create index idx_tasks_list              on tasks(list_id);
create index idx_tasks_household         on tasks(household_id);
create index idx_tasks_assigned          on tasks(assigned_to);
create index idx_tasks_next_due          on tasks(next_due);
create index idx_tasks_grabs             on tasks(is_up_for_grabs) where is_up_for_grabs = true;
create index idx_completions_household   on completions(household_id);
create index idx_completions_by          on completions(completed_by);
create index idx_completions_at          on completions(completed_at desc);
create index idx_feed_household          on feed_events(household_id);
create index idx_feed_created            on feed_events(created_at desc);
create index idx_lola_messages_user      on lola_messages(user_id);
create index idx_lola_messages_user_hh   on lola_messages(user_id, household_id);
create index idx_lola_messages_created   on lola_messages(created_at desc);
create index idx_badges_user             on badges(user_id);
create index idx_likes_completion        on likes(completion_id);
```

---

## 5. Row-Level Security

```sql
alter table households       enable row level security;
alter table users            enable row level security;
alter table lists            enable row level security;
alter table tasks            enable row level security;
alter table completions      enable row level security;
alter table likes            enable row level security;
alter table feed_events      enable row level security;
alter table lola_messages    enable row level security;
alter table badges           enable row level security;
alter table catchup_sessions enable row level security;
alter table weekly_recaps    enable row level security;

-- Helper function: returns current user's household_id
create or replace function auth_household_id()
returns uuid language sql stable security definer as $$
  select household_id from users where id = auth.uid()
$$;

-- Helper function: returns current user's role
create or replace function auth_role()
returns text language sql stable security definer as $$
  select role from users where id = auth.uid()
$$;

-- HOUSEHOLDS
create policy "households: members read own"
  on households for select
  using (id = auth_household_id());

create policy "households: admins update"
  on households for update
  using (id = auth_household_id() and auth_role() = 'admin');

-- USERS
create policy "users: read household members"
  on users for select
  using (household_id = auth_household_id());

create policy "users: update own"
  on users for update using (id = auth.uid());

create policy "users: insert own"
  on users for insert with check (id = auth.uid());

-- LISTS
create policy "lists: household members all"
  on lists for all
  using (household_id = auth_household_id());

-- TASKS
create policy "tasks: household members all"
  on tasks for all
  using (household_id = auth_household_id());

-- COMPLETIONS
create policy "completions: household members all"
  on completions for all
  using (household_id = auth_household_id());

-- LIKES
create policy "likes: household members all"
  on likes for all
  using (
    exists (
      select 1 from completions
      where completions.id = completion_id
      and completions.household_id = auth_household_id()
    )
  );

-- FEED EVENTS
create policy "feed: household members read"
  on feed_events for select
  using (household_id = auth_household_id());

-- LOLA MESSAGES — private per user, no one else sees them
create policy "lola_messages: own only"
  on lola_messages for all
  using (user_id = auth.uid());

-- BADGES
create policy "badges: household members read"
  on badges for select
  using (household_id = auth_household_id());

-- CATCHUP SESSIONS
create policy "catchup: household members all"
  on catchup_sessions for all
  using (household_id = auth_household_id());

-- WEEKLY RECAPS
create policy "recaps: household members read"
  on weekly_recaps for select
  using (household_id = auth_household_id());
```

---

## 6. Supabase Realtime

Enable Realtime on two tables only:

```sql
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table feed_events;
```

- `tasks` — iOS subscribes filtered by household_id. Any task change triggers a task list refetch.
- `feed_events` — iOS subscribes filtered by household_id. New events append to the shared feed.
- `lola_messages` — NOT on Realtime. Lola's responses are streamed via Server-Sent Events (SSE) from the API directly. The iOS client keeps the SSE connection open while Lola is responding.

---

## 7. API Routes — Complete Contract

Base URL: `https://api.lola.app`
All authenticated endpoints require `Authorization: Bearer <supabase_jwt>`
Hono middleware extracts user_id, household_id, and role from JWT on every request.

---

### 7.1 Auth

```
POST  /auth/apple
      Body: { id_token: string, display_name: string, timezone: string }
      Returns: { access_token, refresh_token, user, is_new_user: boolean }
      Action: Exchange Apple identity token with Supabase auth.
              If new user → create users row. If returning → update last_seen_at.

POST  /auth/magic-link
      Body: { email: string }
      Returns: { message: string }

POST  /auth/verify
      Body: { token: string, type: "magiclink" }
      Returns: { access_token, refresh_token, user }

POST  /auth/refresh
      Body: { refresh_token: string }
      Returns: { access_token, refresh_token }
      Action: Proxy to Supabase auth.refreshSession(). iOS calls this endpoint
              when the current access_token expires. Returns new token pair.

POST  /auth/apns-token
      Body: { token: string }
      Returns: { success: true }
      Action: Store APNs device token on users row. Called after iOS requests push permission.
```

---

### 7.2 Households

```
POST  /households
      Body: { name: string, timezone: string }
      Returns: { household, invite_code }
      Action: Creates household. Sets creator as admin. Generates 6-char uppercase invite code.
              Triggers Lola's first message in lola_messages for the creating user.

GET   /households/me
      Returns: { household, members: User[], my_role: string }

PATCH /households/me
      Body: { name?: string, lola_personality?: string }
      Returns: { household }
      Auth: admin only

GET   /households/invite/:code        [PUBLIC — no auth required]
      Returns: { household_name, member_count, max_members, is_full, plan }
      Action: Preview before joining. Safe to call without auth.

POST  /households/join
      Body: { invite_code: string }
      Returns: { household, members }
      Action: Joins household. Enforces member limit for plan.
              Creates feed_event 'member_joined'.
              Triggers Lola's welcome message for the joining user.

DELETE /households/me/leave
      Returns: { success: true }
      Action: If sole admin → blocked, must promote someone first via PATCH member role.
              If last member → household deleted.
              Otherwise → user removed, household_id set null.

PATCH /households/me/members/:user_id/role
      Body: { role: "admin" | "member" }
      Returns: { user }
      Auth: admin only. Cannot demote self if sole admin.

GET   /households/me/export
      Returns: CSV download
      Action: Full task + completion history. Always free, never gated.
```

---

### 7.3 Lists

```
GET   /lists
      Returns: { lists: List[] }
      Default: all non-archived lists for household

POST  /lists
      Body: { name, list_type, color, emoji }
      Returns: { list }
      Auth: any member can create

POST  /lists/bulk
      Body: { lists: [{ name, list_type, color, emoji }] }
      Returns: { lists: List[] }
      Auth: any member. Used by iOS after onboarding to insert AI-generated lists.

PATCH /lists/:id
      Body: { name?, color?, emoji?, list_type?, is_archived? }
      Returns: { list }
      Auth: any member can edit. Changing list_type requires admin.
              Lola confirms list_type changes in the user's chat.

DELETE /lists/:id
      Returns: { success: true }
      Action: Sets is_archived = true. All tasks in list are archived.
      Auth: admin only
```

---

### 7.4 Tasks

```
GET   /tasks
      Query: ?list_id=uuid, ?assigned_to=me|all, ?overdue=true, ?up_for_grabs=true
      Returns: { tasks: Task[] }
      Default: all non-archived tasks sorted by next_due ASC

POST  /tasks
      Body: { list_id, title, category?, recurrence_type?, interval_days?,
              next_due?, assigned_to?, effort_points?, reminder_time?,
              is_up_for_grabs? }
      Returns: { task }
      Auth: any member can create. Member can only assign to self or leave unassigned.
              Admin can assign to anyone.

POST  /tasks/bulk
      Body: { tasks: [{ list_id, title, category, recurrence_type, interval_days,
              next_due, assigned_to, effort_points }] }
      Returns: { tasks: Task[] }
      Auth: any member. Used by iOS after onboarding to insert AI-generated tasks.
              Same assignment rules as POST /tasks.

PATCH /tasks/:id
      Body: { title?, category?, recurrence_type?, interval_days?, next_due?,
              assigned_to?, effort_points?, reminder_time?, is_up_for_grabs?,
              is_archived? }
      Returns: { task }
      Auth: admin can edit any task. Member can only edit tasks assigned to them.

DELETE /tasks/:id
      Returns: { success: true }
      Action: Sets is_archived = true. Never hard deletes.
      Auth: admin can archive any. Member can archive their own only.

POST  /tasks/:id/complete
      Body: { photo_url?: string, was_catchup?: boolean }
      Returns: { task, xp_awarded, new_streak, completion_id }
      Action:
        1. Calculate next_due using recurrence engine
        2. Archive if recurrence_type = 'once'
        3. Insert completion record
        4. Calculate XP (effort_points × 10 + streak_bonus)
        5. Update user xp_total and ring_progress
        6. Update task streak_count
        7. Update family_streak if household list
        8. Recalculate home_score (async)
        9. Check badge triggers (async)
        10. Insert feed_event 'task_completed'
        11. Push notification to all other household members (async)

POST  /tasks/:id/claim
      Returns: { task }
      Action: Assigns is_up_for_grabs task to calling user.
              Race condition handled: returns 409 with "{ error: 'ALREADY_CLAIMED',
              claimed_by_name: string }" if someone else claimed first.

POST  /tasks/:id/like-completion
      Body: { completion_id: string }
      Returns: { like }
      Action: Likes a completion. Inserts into likes table.

GET   /tasks/history
      Query: ?days=90
      Returns: { completions: CompletionWithTask[] }
```

---

### 7.5 Feed

```
GET   /feed
      Query: ?limit=30&before=timestamp
      Returns: { events: FeedEvent[] }
      Action: Cursor-based pagination. Newest first.
              Includes actor display_name and avatar_color in each event.
```

---

### 7.6 Score

```
GET   /score
      Returns: {
        home_score: number,
        label: string,
        family_streak: number,
        breakdown: { completion_rate, streak_health, coverage },
        member_rings: [{ user_id, display_name, ring_progress, avatar_color }],
        family_ring_progress: number
      }
```

---

### 7.7 Lola Chat

```
POST  /lola/message
      Body: { content: string, reply_to_id?: string }
      Returns: SSE stream — Lola's response streamed token by token
      Action:
        1. Rate limit check (10 messages per minute per user, hard block)
        2. Entitlement check (household active)
        3. Save user message to lola_messages
        4. Enqueue in Lane Queue for this user
        5. Assemble full context (see Section 11, Context Assembly)
        6. Call Kimi K2.5 via OpenRouter with streaming enabled
        7. Execute any tool calls in the agentic loop
        8. Stream final response via SSE
        9. Save Lola's response to lola_messages
        10. Persist tool call transcript to JSONL

GET   /lola/messages
      Query: ?limit=50&before=timestamp
      Returns: { messages: LolaMessage[] }
      Action: Cursor-based pagination. Last 50 on load, older on scroll.

POST  /lola/action
      Body: { message_id: string, action: string }
      Returns: { success: true }
      Action: User tapped an action button in a Lola message.
              Validates that the tapping user is the intended recipient.
              Validates role requirement on the action.
              Fires the action (e.g. 'catchup_triage', 'catchup_clear',
              'streak_shield', 'streak_accept').
              Marks message actions as resolved with resolver user_id.
```

---

### 7.8 Gamification

```
GET   /badges
      Returns: { badges: Badge[] }
      Action: All badges for the calling user.

GET   /household-badges
      Returns: { badges: Badge[] }
      Action: All badges for all household members, for profile/feed display.
```

---

### 7.9 Onboarding AI

```
POST  /onboard
      Body: { home_type: string, num_people: number, has_kids: boolean,
              struggle_area: string, household_id: string }
      Returns: { lists: ListDraft[], tasks: TaskDraft[] }
      Action: Calls Lola onboarding agent. Returns suggested lists and tasks.
              Client bulk-inserts them via POST /lists/bulk and POST /tasks/bulk.
              Called once per household on onboarding.
              No auth required beyond valid JWT — called before full setup.
```

---

### 7.10 Subscription

```
POST  /subscription/webhook
      Headers: { Authorization: Bearer REVENUECAT_WEBHOOK_SECRET }
      Body: RevenueCat webhook payload
      Action:
        INITIAL_PURCHASE / RENEWAL → update household plan + plan_expires_at,
                                      set is_active = true
        CANCELLATION / EXPIRATION  → set is_active = false at expiry date
        Verify webhook secret before processing any event.

GET   /subscription/status
      Returns: { plan, is_active, plan_expires_at, trial_expires_at,
                 member_count, max_members }
```

---

### 7.11 Widget

```
GET   /widget
      Returns: {
        home_score: number,
        label: string,
        todays_tasks: [{ id, title, assigned_to, is_completed }],
        ring_progress: number,
        family_streak: number
      }
      Action: Lightweight endpoint for iOS home screen widget.
              Returns home score, today's tasks for the calling user,
              their ring progress, and the family streak.
              Always accessible during trial or paid plan. Never gated.
```

---

## 8. Recurrence Engine

Recurrence is pure TypeScript. Zero AI. Fully deterministic.

**Critical rule:** next_due always resets from completed_at, never from the original next_due. This prevents calendar drift when tasks are completed late.

Recurrence types: `once` | `daily` | `weekly` | `monthly` | `every_n_days`

When recurrence_type is `once` → task is archived after completion.
Weekly is the default recurrence type on all new tasks.

---

## 9. Home Score

Calculated after every completion and every midnight cron.

**Weights:**
- 40% — completion rate (tasks completed vs due in last 7 days, household lists only)
- 35% — streak health (avg streak across active tasks, capped at 14)
- 25% — coverage (% of lists with at least one completion in last 14 days)

**Rules:**
- Minimum score: 10 (never 0)
- Never shown as red in any API response
- Labels: below 40 = "let's get back on track", 40–74 = "good momentum", 75–89 = "looking great", 90+ = "gold standard 🏆"

---

## 10. Gamification System

### XP & Rings

XP is calculated per completion but **never shown to users as a number**.

XP formula: `effort_points × 10 + streak_bonus`
- streak_bonus: 0 for streak < 3, 5 for streak 3–6, 10 for streak 7–13, 20 for streak 14+

**Ring progress:**
- Each user has a personal ring (0–100)
- Household lists only contribute to ring progress
- Personal and project list completions do not contribute
- Ring resets to 0 on the 1st of each month
- ring_progress increments by: min(xp_awarded / 5, 10) per completion (capped to keep ring from filling too fast)
- When ring_progress hits 100 → ring_completed event fires → Lola awards a badge

**Family ring:**
- Stored on households.family_ring_progress (int default 0)
- Fills when all household members have contributed at least one completion this month
- Progress = (members who completed at least once this month / total members) × 100
- When family ring hits 100 → feed_event 'ring_completed' with payload { ring_type: 'family' }

### Streaks

**Task streaks:**
- streak_count on each task increments each time it's completed on schedule
- Resets to 0 if task is more than 1 day overdue when completed

**Family streak:**
- Shared counter on households table
- Increments each day at least one household list task is completed by any member
- Breaks when a member with assigned household tasks misses 2 consecutive days
- Cron checks daily (see streak-checker in Section 15)

**Streak break flow:**
1. Cron detects 2-day miss for a specific member
2. Lola sends a message to the admin's private chat with action buttons
3. Actions: "Let it slide" (streak protected) or "Fair enough" (streak breaks)
4. If admin does not respond → Lola pings again (no automatic resolution in v1)
5. Only the admin who triggered the conversation can tap the buttons

**Streak warning:**
- When family streak is 1 day from potentially breaking, Lola sends a nudge to every member's private chat: "you have tasks due today or the family streak breaks"

### Badges

Lola awards badges via the `award_badge` tool. Badge triggers:

| Badge key | Trigger |
|---|---|
| first_sweep | Complete first task ever |
| on_a_roll | 7-day streak on any single task |
| household_mvp | Most completions in household for a full week |
| team_player | All household members complete at least one task on same calendar day |
| comeback_kid | Complete catch-up mode (either mode) |
| immaculate | Home score 90+ for 30 consecutive days |
| show_off | First completion with a photo |
| speed_run | Complete 5 tasks within a single calendar day |
| ring_master | Personal ring completes for first time |
| family_first | Family ring completes for first time |

When Lola awards a badge:
1. Insert into badges table
2. Insert feed_event 'badge_awarded' (visible to all household members)
3. Send push notification to badge recipient
4. Lola mentions it in the recipient's private chat with personality

### Monthly Challenge

Stored as jsonb on households table.
```
monthly_challenge: {
  "goal": "complete 80% of household tasks this month",
  "target_completion_rate": 0.80,
  "month": "2026-03",
  "current_rate": 0.45,
  "completed": false
}
```
Admin sets the challenge goal by telling Lola. Lola creates it via tool.
Progress updated after every completion.
On month end → the ring-reset cron (1st of month) checks if previous month's challenge was completed. If completed → feed_event 'monthly_challenge_completed'. Then clears the monthly_challenge field for the new month.

---

## 11. Lola Agent — OpenClaw Pattern

### Architecture

Lola follows the OpenClaw agentic loop exactly:

```
user message arrives at POST /lola/message
→ rate limit check (10/min per user, hard block at Hono middleware layer)
→ entitlement check
→ save user message to lola_messages
→ enqueue in Lane Queue for this user_id
→ Lane Queue processes one message at a time per user (serial execution)
→ assemble full context (see Context Assembly below)
→ call Kimi K2.5 via OpenRouter with tool schemas + streaming enabled
→ agentic loop:
    if model requests tool call → execute tool → feed result back → loop
    if model produces final text → stream via SSE → exit loop
→ save Lola's final response to lola_messages
→ persist full transcript to JSONL file
```

**Max iterations per message:** 10 (prevents runaway loops)
**Timeout:** 60 seconds per message (Cloudflare Workers limit)

### Lane Queue

One serial queue per user_id. Messages processed in order. While Lola is processing message N, message N+1 waits. This prevents race conditions and context corruption.

Session key format: `household_id:user_id`

### Streaming

OpenRouter streaming enabled. Lola's response streams token by token via SSE to the iOS client. The client renders the message as it arrives, same as ChatGPT.

SSE event format:
```
event: delta
data: { "text": "hey " }

event: delta
data: { "text": "the " }

event: done
data: { "message_id": "uuid", "has_actions": false }
```

If Lola's response includes action buttons, they are sent in the `done` event.

### Context Assembly (Bootstrap Files)

Context is assembled fresh on every single message. Never stale. Four files assembled silently before each OpenRouter call:

**SOUL.md** (role-aware personality file):
```
You are Lola, a family life organizer assistant.
Personality: {calm|balanced|sassy based on household.lola_personality}
Role context: You are speaking with {display_name}, who is {admin|a member} of the {household_name} household.

If admin: You can perform all household operations. You proactively share household health, catch-up alerts, and streak warnings.
If member: You are a personal assistant for {display_name} only. You help them with their own tasks and keep them informed about household happenings. You cannot perform admin operations. If they ask for something admin-only, decline in character.

Core rules:
- Never use the word "overdue" or "behind" 
- Never mention exact days missed
- Never guilt anyone
- Appreciation over punishment always
- When personality is sassy: light humor, gentle teasing, never mean
- When personality is calm: warm and neutral, no jokes
- When personality is balanced: warm with occasional personality
```

**USER.md** (per-user state):
```
User: {display_name}
Role: {admin|member}
Timezone: {timezone}
Total XP: {xp_total} (never share this number with the user)
Ring progress: {ring_progress}/100
Badges earned: {badge list}
Your assigned tasks (household lists):
{list of tasks with due dates, effort points, streak counts}
Your assigned tasks (personal/project lists):
{list}
Your completions this week: {count}
Your current task streaks: {list of tasks with streak counts}
```

**HOUSEHOLD.md** (household context):
```
Household: {name}
Plan: {plan}
Members: {name (admin|member), ring_progress for each}
Home Score: {score} — {label}
Family Streak: {count} days
All household list tasks (for context):
{full task list with assignees}
Household completions this week: {count}
Catch-up pending: {true|false}
Monthly challenge: {goal and current progress}
```

**MEMORY.md** (compacted conversation history):
```
{summarized older conversation — updated by compaction when history exceeds 20 messages}
```

Plus the last 20 messages of live conversation history as the actual message array.

**Total context budget per call:**
- SOUL.md: ~300 tokens
- USER.md: ~400 tokens
- HOUSEHOLD.md: ~600 tokens
- MEMORY.md: ~200 tokens (grows then compacts)
- Last 20 messages: ~2000 tokens
- Tool schemas: ~800 tokens
- Total: ~4300 tokens per call (well within Kimi K2.5's 131K context window)

### Compaction

When live message history exceeds 20 messages:
1. Take messages 1 through (N-20)
2. Summarize them silently into MEMORY.md for that user
3. Store compacted MEMORY.md in Supabase Storage at `lola-memory/{user_id}/memory.md`
4. Live history window slides to last 20 messages only
5. User never sees this happening

### JSONL Transcript

Every agentic loop run is persisted to Supabase Storage at:
`lola-transcripts/{user_id}/{session_date}.jsonl`

Each line: `{ timestamp, role, content, tool_calls?, tool_results?, cost? }`

Used for debugging and future memory retrieval. Never shown to users.

### Tool Schemas

All tools passed as JSON schemas to Kimi K2.5. Model decides which tools to call based on user message and tool descriptions. Kimi K2.5 handles natural language task parsing natively via tool calling — it extracts structured create_task params directly from conversational messages. No separate NLP agent is needed. Tool call/result pairs are always kept atomic — never pruned separately.

**Complete tool list:**

`get_tasks`
Fetch tasks for the household. Filterable by list_id, assigned_to, overdue, up_for_grabs.

`create_task`
Create a new task. Params: title, list_id, category, recurrence_type, interval_days, next_due, assigned_to, effort_points, reminder_time, is_up_for_grabs.
Member restriction: can only assign to self or leave unassigned.

`update_task`
Update any field on an existing task.
Member restriction: can only update tasks assigned to them.

`complete_task`
Mark a task as completed. Triggers XP, streak, feed event, push notifications.

`archive_task`
Soft-delete a task.
Member restriction: own tasks only.

`assign_task`
Reassign a task to a different member.
Member restriction: blocked — admin only.

`claim_task`
Claim an up-for-grabs task for the calling user.

`get_lists`
Fetch all lists for the household.

`create_list`
Create a new list. Params: name, list_type, color, emoji.

`update_list`
Update list fields. Changing list_type is admin-only.

`get_member_stats`
Get completion counts, XP, ring progress, streaks for household members. Used for recap and streak tracking.

`get_home_score`
Get current home score, label, and breakdown.

`get_household`
Get household name, members, plan, streak, personality setting.

`get_feed`
Fetch recent feed events.

`send_feed_message`
Post an event to the shared household feed. Used by Lola for weekly recaps and milestone celebrations.

`send_chat_message`
Post a message into the calling user's private Lola chat. Supports optional actions array for interactive buttons.

Actions array shape:
```json
[
  {
    "label": "Sort it out",
    "action": "catchup_triage",
    "requires_role": "admin"
  },
  {
    "label": "Fresh start",
    "action": "catchup_clear",
    "requires_role": "admin"
  }
]
```

`trigger_catchup`
Initiate catch-up mode. Takes mode: 'triage' or 'clear'. Admin only.
Triage → calls catch-up AI agent → applies decisions → creates catchup_session.
Clear → archives all overdue household list tasks → clean slate.

`set_reminder`
Set push notification reminder time for a task. Params: task_id, reminder_time (HH:MM in user's timezone).

`award_badge`
Award a badge to a user. Params: user_id, badge_key. Creates badge row, feed event, push, and Lola chat message.

`get_monthly_challenge`
Get current monthly challenge state.

`set_monthly_challenge`
Set or update the monthly challenge goal. Admin only.

`get_streak_status`
Get family streak count, days at risk, which members are behind.

`protect_streak`
Admin-only. Called when admin taps "Let it slide" action button.

### Role Enforcement in Tools

Every tool checks the calling user's role before executing. If a member calls an admin-only tool, Lola responds in character:

- Sassy: "cute. that's an admin move — ask [admin name] to handle it 🧹"
- Balanced: "that one's for the admins — [admin name] can take care of it"
- Calm: "that action requires admin access. [admin name] can help with that"

---

## 12. Supporting AI Agents

Three supporting agents called by specific triggers. Each is a single LLM call (not an agentic loop). They return structured JSON which the server applies directly.

### 12.1 Onboarding Agent

**Trigger:** POST /onboard — once per household during setup
**Model:** Kimi K2.5 via OpenRouter
**Goal:** Generate starter lists and tasks so no family faces a blank screen

System prompt instructs Lola to generate 2-4 suggested lists and 15-20 tasks distributed across them, weighted toward the family's stated struggle area. If `has_kids` is true, include age-appropriate tasks for younger family members. Returns JSON only.

Response shape:
```json
{
  "lists": [
    { "name": "Kitchen", "list_type": "household", "emoji": "🍳", "color": "#FF6B6B" }
  ],
  "tasks": [
    {
      "list_name": "Kitchen",
      "title": "Clean the stovetop",
      "category": "kitchen",
      "recurrence_type": "weekly",
      "interval_days": null,
      "effort_points": 2,
      "suggested_assignee": "adult"
    }
  ]
}
```

### 12.2 Catch-Up Mode Agent

**Trigger:** Admin taps "Sort it out" action button in Lola chat
**Model:** Kimi K2.5 via OpenRouter
**Goal:** Triage every overdue household list task into CRITICAL / FLEXIBLE / SKIP

Categories map to defaults:
- CRITICAL: hygiene, kitchen
- FLEXIBLE: laundry, tidying, maintenance, outdoor, school, work
- SKIP: errands, personal — and any task overdue by 14+ days with effort_points 1

Tone rules enforced in system prompt:
- Never mention days overdue
- Never use "overdue" or "behind"
- Reason is one warm sentence per task

Server applies decisions after AI response:
1. CRITICAL → reschedule next_due to today
2. FLEXIBLE → reschedule next_due to today + interval_days
3. SKIP → archive task
4. Log all decisions to catchup_sessions.ai_decisions
5. Set household.catchup_pending = false
6. Create feed_event 'catchup_completed'
7. Award 'comeback_kid' badge to triggering user

### 12.3 Weekly Recap Agent

**Trigger:** Supabase Edge Function cron, every Sunday at 8pm in household's timezone
**Model:** Kimi K2.5 via OpenRouter
**Goal:** Generate warm weekly summary

Input: household name, all member completion counts, top tasks completed, home score, family streak, longest individual streak.

Output:
```json
{
  "summary": string,
  "nudge": string,
  "push_title": string,
  "push_body": string
}
```

Server after AI response:
1. Save to weekly_recaps
2. Create feed_event 'weekly_recap' with summary + nudge in payload
3. Push notification to all members via push_title + push_body

Tone rules: warm team celebration, never pit members against each other, if teens contributed call them out warmly, never mention what wasn't done.

---

## 13. Push Notifications

All pushes sent via APNs HTTP/2 with JWT authentication.
Device tokens stored in users.apns_token.

**Notification events and recipients:**

| Event | Recipients | Copy style |
|---|---|---|
| Task assigned to you | Assignee only | "Lola: [task title] is yours" |
| Task completed | All other household members | "[name] just [task title] ✓" |
| Streak warning | All members with assigned tasks | "5 tasks left today or the streak breaks 👀" |
| Streak broken | All members | "the streak broke. Lola's not mad, just disappointed 🧹" |
| Badge awarded | Badge recipient | "[badge name] — Lola's impressed" |
| Weekly recap | All members | push_title + push_body from AI |
| Catch-up pending | Admin only | "Lola's got some thoughts on the backlog 👀" |
| Member joined | All existing members | "[name] just joined the household" |

---

## 14. Feed Event Payload Shapes

```typescript
// task_completed
payload: {
  task_title: string,
  list_name: string,
  effort_points: number,
  actor_name: string,
  actor_avatar_color: string,
  photo_url?: string,
  new_streak: number,       // 0 if streak < 2
  xp_awarded: number
}

// badge_awarded
payload: {
  badge_key: string,
  recipient_name: string,
  recipient_avatar_color: string
}

// streak_milestone
payload: {
  streak_count: number,
  actor_name: string,
  task_title: string
}

// streak_broken
payload: {
  previous_streak: number,
  broken_by_name: string
}

// home_score_milestone
payload: {
  score: number,
  label: string
}

// weekly_recap
payload: {
  summary: string,
  nudge: string
}

// catchup_completed
payload: {
  mode: "triage" | "clear",
  tasks_reset: number,
  tasks_archived: number,
  actor_name: string
}

// member_joined
payload: {
  new_member_name: string,
  avatar_color: string
}

// ring_completed
payload: {
  ring_type: "personal" | "family",
  actor_name?: string
}

// monthly_challenge_completed
payload: {
  goal: string,
  completion_rate: number
}
```

---

## 15. Supabase Edge Function Crons

Five cron jobs deployed as Supabase Edge Functions.

**catchup-detector** — daily at 10am UTC
Finds households where all members' last_seen_at is older than 5 days.
Sets household.catchup_pending = true.
Sends APNs push to admin: "Lola's got some thoughts on the backlog 👀"

**home-score-calc** — daily at midnight UTC
Recalculates home_score for every active household.
Process in batches of 50. Updates households.home_score.
Creates feed_event 'home_score_milestone' if score crosses 75 or 90 for first time in 7 days.

**weekly-recap** — runs hourly; process households where local time is Sunday 8:00pm
For each active household at local Sunday 8:00pm:
1. Fetch weekly completion data per member
2. Call weekly recap AI agent
3. Save to weekly_recaps
4. Create feed_event 'weekly_recap'
5. Push to all members

**streak-checker** — runs every hour on the hour
For each active household where the current UTC hour maps to 11pm in the household's timezone:
1. Check if any member with assigned household tasks has missed 2+ consecutive days
2. If yes → send Lola message to admin's private chat with streak action buttons
3. If family streak should have incremented today → increment it
4. Update households.family_streak and streak_last_updated

**ring-reset** — 1st of every month at midnight UTC
Resets ring_progress to 0 for all users.
Resets households.family_ring_progress to 0.
Checks if previous month's monthly_challenge was completed → if yes, creates feed_event 'monthly_challenge_completed'.
Clears monthly_challenge field to null for the new month.

---

## 16. Key Business Logic Rules

These are non-negotiable. Enforced in API layer.

1. **Recurrence clock resets from completion date.** next_due = completed_at + interval. Never from original next_due.

2. **Household lists only for gamification.** Personal and project list completions do not earn XP, do not contribute to rings, do not affect home score, do not count toward streak.

3. **Tasks never hard deleted.** Always is_archived = true.

4. **Completions never deleted.** Permanent history.

5. **Home score minimum 10.** Never 0. Never shown as red.

6. **No guilt language.** "Overdue" and "behind" never appear in any Lola response. Enforced at prompt level.

7. **Admin protection.** Sole admin cannot leave or be demoted. At least one admin always exists.

8. **Task claiming is atomic.** Race condition returns 409 with claimer's name.

9. **Action buttons are role-gated and single-use.** Only intended recipient can tap. Once tapped, marked resolved for all viewers.

10. **Rate limit is hard.** 10 messages per minute per user. No soft warning. Hard 429 response.

11. **Lola only speaks when spoken to OR when a proactive trigger fires.** She does not randomly inject herself into users' days.

12. **Data export always free.** Never gated behind plan.

13. **Widget data endpoint always accessible.** GET /widget returns home score, today's tasks, ring progress regardless of subscription status (within trial or paid).

14. **Member can only assign tasks to themselves.** Admin can assign to anyone.

15. **XP is never shown to users.** Only ring progress (visual) and badges (earned milestones) are shown.

---

## 17. Environment Variables

```bash
# ── Supabase ──────────────────────────────────────────────────
SUPABASE_URL=REPLACE_ME
SUPABASE_ANON_KEY=REPLACE_ME
SUPABASE_SERVICE_ROLE_KEY=REPLACE_ME
SUPABASE_JWT_SECRET=REPLACE_ME

# ── OpenRouter (Kimi K2.5) ────────────────────────────────────
OPENROUTER_API_KEY=REPLACE_ME
OPENROUTER_MODEL=moonshot/kimi-k2.5

# ── Apple Push Notifications ──────────────────────────────────
APNS_KEY_ID=REPLACE_ME
APNS_TEAM_ID=REPLACE_ME
APNS_PRIVATE_KEY=REPLACE_ME
APP_BUNDLE_ID=REPLACE_ME

# ── RevenueCat ────────────────────────────────────────────────
REVENUECAT_WEBHOOK_SECRET=REPLACE_ME

# ── App ───────────────────────────────────────────────────────
APP_ENV=development
INVITE_CODE_SALT=REPLACE_ME
```

wrangler.toml (non-secret only):
```toml
name = "lola-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
APP_ENV = "production"
APP_BUNDLE_ID = "com.lola.app"
OPENROUTER_MODEL = "moonshot/kimi-k2.5"
```

---

## 18. Project Structure

```
lola-api/
├── src/
│   ├── index.ts                    ← Hono entry, middleware, routes
│   ├── middleware/
│   │   ├── auth.ts                 ← JWT validation, user context injection
│   │   ├── entitlement.ts          ← Household active check, member limits
│   │   └── rateLimit.ts            ← 10 msg/min per user for Lola chat
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── households.ts
│   │   ├── lists.ts
│   │   ├── tasks.ts
│   │   ├── feed.ts
│   │   ├── score.ts
│   │   ├── widget.ts               ← GET /widget for iOS home screen widget
│   │   ├── lola.ts                 ← Chat, streaming, action buttons
│   │   ├── onboard.ts
│   │   ├── gamification.ts         ← Badges endpoint
│   │   └── subscription.ts
│   ├── agent/
│   │   ├── loop.ts                 ← OpenClaw agentic loop
│   │   ├── laneQueue.ts            ← Per-user serial execution queue
│   │   ├── context.ts              ← SOUL/USER/HOUSEHOLD/MEMORY assembly
│   │   ├── compaction.ts           ← Context compression logic
│   │   ├── tools/
│   │   │   ├── index.ts            ← Tool registry + schemas
│   │   │   ├── tasks.ts            ← Task tools
│   │   │   ├── lists.ts            ← List tools
│   │   │   ├── household.ts        ← Household + member tools
│   │   │   ├── feed.ts             ← Feed + chat tools
│   │   │   ├── gamification.ts     ← Badge + streak + challenge tools
│   │   │   └── catchup.ts          ← Catch-up mode trigger tool
│   │   └── prompts/
│   │       ├── soul.ts             ← SOUL.md template (admin + member versions)
│   │       ├── onboard.ts          ← Onboarding agent prompt
│   │       ├── catchup.ts          ← Catch-up triage prompt
│   │       └── weeklyRecap.ts      ← Weekly recap prompt
│   ├── lib/
│   │   ├── supabase.ts             ← Supabase client (service role)
│   │   ├── openrouter.ts           ← OpenRouter streaming wrapper
│   │   ├── apns.ts                 ← APNs push sender
│   │   ├── recurrence.ts           ← next_due calculation
│   │   ├── score.ts                ← Home score calculation
│   │   ├── xp.ts                   ← XP + ring + badge trigger logic
│   │   ├── streak.ts               ← Streak calculation + break detection
│   │   └── invite.ts               ← 6-char invite code generator
│   └── types.ts                    ← All shared TypeScript interfaces
├── supabase/
│   └── functions/
│       ├── catchup-detector/
│       ├── home-score-calc/
│       ├── weekly-recap/
│       ├── streak-checker/
│       └── ring-reset/
├── wrangler.toml
├── package.json
└── tsconfig.json
```

---

## 19. Build Order

Build in this exact sequence. Each phase is independently testable.

```
PHASE 1 — Foundation
  [ ] Supabase: run schema SQL (Section 4)
  [ ] Supabase: run RLS SQL (Section 5)
  [ ] Supabase: enable Realtime (Section 6)
  [ ] Hono: scaffold, wrangler.toml, tsconfig
  [ ] auth middleware + entitlement middleware
  [ ] /auth routes (Apple Sign In + magic link + refresh + apns-token)
  [ ] /households routes (create, join, preview, leave, member role)

  ✓ MILESTONE: User can sign in, create household, invite family

PHASE 2 — Core Product (Accord copy)
  [ ] lib/recurrence.ts
  [ ] lib/score.ts
  [ ] /lists routes (CRUD + bulk)
  [ ] /tasks routes (CRUD + bulk + complete + claim + like)
  [ ] /feed route
  [ ] /score route
  [ ] /widget route
  [ ] Supabase Realtime on tasks + feed_events

  ✓ MILESTONE: Family can create lists, assign tasks, complete them,
               see activity feed. Exact Accord functionality.

PHASE 3 — Gamification
  [ ] lib/xp.ts (XP formula + ring progress + badge triggers)
  [ ] lib/streak.ts (task streaks + family streak)
  [ ] /gamification routes (badges)
  [ ] Badge trigger checks wired into POST /tasks/:id/complete
  [ ] Ring reset logic
  [ ] Monthly challenge (get + set via Lola tools)

  ✓ MILESTONE: Rings filling, badges awarded, streaks tracking

PHASE 4 — Lola Agent
  [ ] lib/openrouter.ts (streaming wrapper)
  [ ] agent/laneQueue.ts
  [ ] agent/context.ts (SOUL/USER/HOUSEHOLD/MEMORY assembly)
  [ ] agent/compaction.ts
  [ ] agent/tools/* (all tools)
  [ ] agent/loop.ts (full OpenClaw agentic loop)
  [ ] /lola routes (message with SSE streaming, messages pagination, action)
  [ ] Rate limiting middleware for /lola/message
  [ ] JSONL transcript persistence to Supabase Storage
  [ ] MEMORY.md compaction to Supabase Storage
  [ ] /onboard route (onboarding AI agent)

  ✓ MILESTONE: Lola responds, creates tasks, assigns them,
               handles natural language, streams responses

PHASE 5 — Notifications + Crons
  [ ] lib/apns.ts
  [ ] Wire push on: task assigned, task completed, badge awarded,
      streak warning, streak broken, weekly recap, catchup pending
  [ ] Supabase Edge Functions:
      [ ] catchup-detector
      [ ] home-score-calc
      [ ] weekly-recap
      [ ] streak-checker (hourly, timezone-filtered)
      [ ] ring-reset (includes monthly challenge completion check)

  ✓ MILESTONE: All pushes firing, all crons running

PHASE 6 — Catch-Up Mode
  [ ] agent/prompts/catchup.ts
  [ ] Catch-up triage AI agent (sub-call inside trigger_catchup tool)
  [ ] Clear mode (archive all overdue household tasks)
  [ ] Streak protection flow (Lola asks admin, action buttons)
  [ ] catchup_sessions logging

  ✓ MILESTONE: Full catch-up flow working end to end

PHASE 7 — Monetization
  [ ] RevenueCat webhook handler (/subscription/webhook)
  [ ] Subscription status endpoint
  [ ] Trial expiry enforcement (midnight check per timezone)
  [ ] Member limit enforcement per plan
  [ ] Non-admin trial-expired screen data
  [ ] Data export (/households/me/export as CSV)

  ✓ MILESTONE: Full monetization. Trial → paywall → paid. Member limits enforced.
```

---

## 20. What Good Looks Like

A complete Postman test sequence should produce:

1. POST /auth/apple → JWT received
2. POST /households `{ name: "The Johnsons", timezone: "America/Toronto" }` → household created, invite_code returned, Lola sends first message in lola_messages
3. Second user POST /households/join with invite_code → joined, feed shows 'member_joined'
4. POST /onboard `{ home_type: "house", num_people: 4, has_kids: false, struggle_area: "kitchen always messy", household_id: "uuid" }` → 2-4 lists and 15-20 tasks returned, weighted toward kitchen
5. POST /lists/bulk with lists from onboard response → lists created
6. POST /tasks/bulk with tasks from onboard response → tasks created, linked to list IDs from step 5
7. GET /tasks → tasks visible, sorted by next_due ASC
8. POST /lola/message `{ content: "assign the kitchen tasks to me" }` → SSE stream, Lola calls assign_task tool for each kitchen task, confirms in natural language
9. POST /tasks/:id/complete → XP awarded, ring_progress incremented, feed_event created, push sent to other member
10. GET /score → home_score between 10-100, label is positive framing
11. GET /feed → task_completed event visible with actor name and task title
12. POST /lola/message `{ content: "remind me to vacuum every Sunday at 9am" }` → Lola calls set_reminder tool, confirms in chat
13. Simulate 5 days inactive → catchup-detector sets catchup_pending = true → push sent to admin
14. GET /lola/messages → Lola's catch-up message visible with action buttons
15. POST /lola/action `{ message_id: uuid, action: "catchup_triage" }` → catch-up agent runs, decisions applied, feed shows 'catchup_completed'
16. POST /subscription/webhook (RevenueCat INITIAL_PURCHASE for lola_family_s_monthly) → household plan updated to 'family_s', is_active true
17. Member tries POST /lola/message asking to assign task to another member → Lola declines in character, role-appropriate personality
18. GET /widget → returns home_score, today's tasks, ring_progress, family_streak
19. POST /auth/refresh with refresh_token → new token pair returned

---

*Lola — built for families who have better things to do than manage a chore app.*
