import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ROLE_ADMIN, ROLE_MEMBER } from '../constants';
import { assertAssignable } from './tasks';

const migrationPath = resolve(process.cwd(), 'supabase/migrations/20260301192539_onboarding_async_rls_hardening.sql');
const migrationSql = readFileSync(migrationPath, 'utf8');

describe('rls hardening migration', () => {
  it('locks cross-household policies to auth household', () => {
    expect(migrationSql).toMatch(/create policy lists_select_household[\s\S]*household_id = public\.auth_household_id\(\)/);
    expect(migrationSql).toMatch(/create policy tasks_select_household[\s\S]*household_id = public\.auth_household_id\(\)/);
    expect(migrationSql).toMatch(/create policy users_select_scope[\s\S]*household_id = public\.auth_household_id\(\)/);
  });

  it('keeps authenticated users read-only on protected system tables', () => {
    expect(migrationSql).not.toMatch(/on public\.feed_events\s+for insert/);
    expect(migrationSql).not.toMatch(/on public\.badges\s+for insert/);
    expect(migrationSql).not.toMatch(/on public\.catchup_sessions\s+for insert/);
    expect(migrationSql).not.toMatch(/on public\.weekly_recaps\s+for insert/);
    expect(migrationSql).not.toMatch(/on public\.lola_messages\s+for insert/);
  });

  it('creates onboarding async tables with explicit rls policies', () => {
    expect(migrationSql).toMatch(/create table if not exists public\.onboarding_suggestion_jobs/);
    expect(migrationSql).toMatch(/create table if not exists public\.onboarding_suggestion_applies/);
    expect(migrationSql).toMatch(/alter table public\.onboarding_suggestion_jobs enable row level security/);
    expect(migrationSql).toMatch(/alter table public\.onboarding_suggestion_applies enable row level security/);
    expect(migrationSql).toMatch(/create policy onboarding_jobs_insert_own/);
    expect(migrationSql).toMatch(/create policy onboarding_applies_insert_own/);
  });

  it('contains db guards for users profile mutation boundaries', () => {
    expect(migrationSql).toMatch(/create or replace function public\.users_update_guard\(\)/);
    expect(migrationSql).toMatch(/if new\.role is distinct from old\.role then/);
    expect(migrationSql).toMatch(/if new\.household_id is distinct from old\.household_id then/);
  });

  it('contains db guard preventing member cross-user assignment', () => {
    expect(migrationSql).toMatch(/create or replace function public\.tasks_assignment_guard\(\)/);
    expect(migrationSql).toMatch(/new\.assigned_to is distinct from auth\.uid\(\)/);
    expect(migrationSql).toMatch(/members can only assign tasks to themselves/);
  });
});

describe('task assignment api boundary', () => {
  it('allows admins to assign tasks to others', () => {
    expect(() => assertAssignable(ROLE_ADMIN, 'user-a', 'user-b')).not.toThrow();
  });

  it('blocks members from assigning tasks to others', () => {
    expect(() => assertAssignable(ROLE_MEMBER, 'user-a', 'user-b')).toThrowError(/ASSIGNMENT_FORBIDDEN|members can only self-assign/);
  });

  it('allows member self-assignment', () => {
    expect(() => assertAssignable(ROLE_MEMBER, 'user-a', 'user-a')).not.toThrow();
  });
});
