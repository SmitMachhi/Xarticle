alter table households enable row level security;
alter table users enable row level security;
alter table lists enable row level security;
alter table tasks enable row level security;
alter table completions enable row level security;
alter table likes enable row level security;
alter table feed_events enable row level security;
alter table lola_messages enable row level security;
alter table badges enable row level security;
alter table catchup_sessions enable row level security;
alter table weekly_recaps enable row level security;

create or replace function auth_household_id()
returns uuid language sql stable security definer as $$
  select household_id from users where id = auth.uid()
$$;

create or replace function auth_role()
returns text language sql stable security definer as $$
  select role from users where id = auth.uid()
$$;

create policy "households: members read own"
  on households for select using (id = auth_household_id());
create policy "households: admins update"
  on households for update using (id = auth_household_id() and auth_role() = 'admin');
create policy "users: read household members"
  on users for select using (household_id = auth_household_id());
create policy "users: update own"
  on users for update using (id = auth.uid());
create policy "users: insert own"
  on users for insert with check (id = auth.uid());
create policy "lists: household members all"
  on lists for all using (household_id = auth_household_id());
create policy "tasks: household members all"
  on tasks for all using (household_id = auth_household_id());
create policy "completions: household members all"
  on completions for all using (household_id = auth_household_id());
create policy "likes: household members all"
  on likes for all using (
    exists (
      select 1
      from completions
      where completions.id = completion_id and completions.household_id = auth_household_id()
    )
  );
create policy "feed: household members read"
  on feed_events for select using (household_id = auth_household_id());
create policy "lola_messages: own only"
  on lola_messages for all using (user_id = auth.uid());
create policy "badges: household members read"
  on badges for select using (household_id = auth_household_id());
create policy "catchup: household members all"
  on catchup_sessions for all using (household_id = auth_household_id());
create policy "recaps: household members read"
  on weekly_recaps for select using (household_id = auth_household_id());
