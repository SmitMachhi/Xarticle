begin;

create table if not exists public.onboarding_suggestion_jobs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  requested_by uuid not null references public.users(id) on delete cascade,
  input jsonb not null,
  status text not null check (status in ('queued', 'processing', 'ready', 'failed')),
  attempt_count int not null default 0,
  model text not null,
  reasoning_mode text,
  suggestions jsonb,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists idx_onboarding_jobs_household_created
  on public.onboarding_suggestion_jobs(household_id, created_at desc);
create index if not exists idx_onboarding_jobs_status_created
  on public.onboarding_suggestion_jobs(status, created_at asc);

create table if not exists public.onboarding_suggestion_applies (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.onboarding_suggestion_jobs(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  applied_by uuid not null references public.users(id) on delete cascade,
  idempotency_key text not null,
  selected_list_ids jsonb not null,
  selected_task_ids jsonb not null,
  created_list_ids jsonb not null,
  created_task_ids jsonb not null,
  created_at timestamptz not null default now(),
  unique (job_id, idempotency_key)
);

create index if not exists idx_onboarding_applies_household_created
  on public.onboarding_suggestion_applies(household_id, created_at desc);

alter table public.households enable row level security;
alter table public.users enable row level security;
alter table public.lists enable row level security;
alter table public.tasks enable row level security;
alter table public.completions enable row level security;
alter table public.likes enable row level security;
alter table public.feed_events enable row level security;
alter table public.lola_messages enable row level security;
alter table public.badges enable row level security;
alter table public.catchup_sessions enable row level security;
alter table public.weekly_recaps enable row level security;
alter table public.onboarding_suggestion_jobs enable row level security;
alter table public.onboarding_suggestion_applies enable row level security;

create or replace function public.auth_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.users where id = auth.uid()
$$;

create or replace function public.auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

grant execute on function public.auth_household_id() to anon, authenticated, service_role;
grant execute on function public.auth_role() to anon, authenticated, service_role;

do $$
declare
  item record;
begin
  for item in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'households',
        'users',
        'lists',
        'tasks',
        'completions',
        'likes',
        'feed_events',
        'lola_messages',
        'badges',
        'catchup_sessions',
        'weekly_recaps',
        'onboarding_suggestion_jobs',
        'onboarding_suggestion_applies'
      )
  loop
    execute format('drop policy if exists %I on public.%I', item.policyname, item.tablename);
  end loop;
end
$$;

create policy households_select_own
  on public.households
  for select
  using (id = public.auth_household_id());

create policy households_insert_authenticated
  on public.households
  for insert
  with check (auth.uid() is not null);

create policy households_update_admin
  on public.households
  for update
  using (id = public.auth_household_id() and public.auth_role() = 'admin')
  with check (id = public.auth_household_id() and public.auth_role() = 'admin');

create policy users_select_scope
  on public.users
  for select
  using (id = auth.uid() or household_id = public.auth_household_id());

create policy users_insert_self
  on public.users
  for insert
  with check (id = auth.uid());

create policy users_update_self
  on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy lists_select_household
  on public.lists
  for select
  using (household_id = public.auth_household_id());

create policy lists_insert_household
  on public.lists
  for insert
  with check (household_id = public.auth_household_id() and created_by = auth.uid());

create policy lists_update_household
  on public.lists
  for update
  using (household_id = public.auth_household_id())
  with check (household_id = public.auth_household_id());

create policy tasks_select_household
  on public.tasks
  for select
  using (household_id = public.auth_household_id());

create policy tasks_insert_household
  on public.tasks
  for insert
  with check (household_id = public.auth_household_id() and created_by = auth.uid());

create policy tasks_update_household
  on public.tasks
  for update
  using (household_id = public.auth_household_id())
  with check (household_id = public.auth_household_id());

create policy completions_select_household
  on public.completions
  for select
  using (household_id = public.auth_household_id());

create policy completions_insert_household
  on public.completions
  for insert
  with check (household_id = public.auth_household_id() and completed_by = auth.uid());

create policy likes_select_household
  on public.likes
  for select
  using (
    exists (
      select 1
      from public.completions
      where public.completions.id = public.likes.completion_id
        and public.completions.household_id = public.auth_household_id()
    )
  );

create policy likes_insert_household
  on public.likes
  for insert
  with check (
    liked_by = auth.uid()
    and exists (
      select 1
      from public.completions
      where public.completions.id = public.likes.completion_id
        and public.completions.household_id = public.auth_household_id()
    )
  );

create policy feed_events_select_household
  on public.feed_events
  for select
  using (household_id = public.auth_household_id());

create policy lola_messages_select_own
  on public.lola_messages
  for select
  using (user_id = auth.uid());

create policy badges_select_household
  on public.badges
  for select
  using (household_id = public.auth_household_id());

create policy catchup_sessions_select_household
  on public.catchup_sessions
  for select
  using (household_id = public.auth_household_id());

create policy weekly_recaps_select_household
  on public.weekly_recaps
  for select
  using (household_id = public.auth_household_id());

create policy onboarding_jobs_select_own
  on public.onboarding_suggestion_jobs
  for select
  using (requested_by = auth.uid() and household_id = public.auth_household_id());

create policy onboarding_jobs_insert_own
  on public.onboarding_suggestion_jobs
  for insert
  with check (requested_by = auth.uid() and household_id = public.auth_household_id());

create policy onboarding_applies_select_own
  on public.onboarding_suggestion_applies
  for select
  using (
    applied_by = auth.uid()
    and household_id = public.auth_household_id()
    and exists (
      select 1
      from public.onboarding_suggestion_jobs
      where public.onboarding_suggestion_jobs.id = public.onboarding_suggestion_applies.job_id
        and public.onboarding_suggestion_jobs.requested_by = auth.uid()
    )
  );

create policy onboarding_applies_insert_own
  on public.onboarding_suggestion_applies
  for insert
  with check (
    applied_by = auth.uid()
    and household_id = public.auth_household_id()
    and exists (
      select 1
      from public.onboarding_suggestion_jobs
      where public.onboarding_suggestion_jobs.id = public.onboarding_suggestion_applies.job_id
        and public.onboarding_suggestion_jobs.requested_by = auth.uid()
        and public.onboarding_suggestion_jobs.household_id = public.auth_household_id()
    )
  );

create or replace function public.users_update_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.id is distinct from auth.uid() then
    raise exception 'users update forbidden';
  end if;

  if new.role is distinct from old.role then
    raise exception 'role changes require privileged flow';
  end if;

  if new.household_id is distinct from old.household_id then
    raise exception 'household changes require privileged flow';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_users_update_guard on public.users;
create trigger trg_users_update_guard
before update on public.users
for each row
execute function public.users_update_guard();

create or replace function public.tasks_assignment_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  actor_role := public.auth_role();
  if coalesce(actor_role, 'member') <> 'admin'
     and new.assigned_to is not null
     and new.assigned_to is distinct from auth.uid() then
    raise exception 'members can only assign tasks to themselves';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_tasks_assignment_guard on public.tasks;
create trigger trg_tasks_assignment_guard
before insert or update on public.tasks
for each row
execute function public.tasks_assignment_guard();

commit;
