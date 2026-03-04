import { z } from 'zod';

import { isoDate } from '../../lib/dates';
import { calculateHomeScore } from '../../lib/score';
import { computeScoreMetrics } from '../../lib/score-metrics';
import { mustData } from '../../lib/supabase';
import type { ToolDefinition } from './shared';
import { getToolService, requireAdminRole } from './shared';

const monthlySchema = z.object({
  current_rate: z.number().optional(),
  goal: z.string(),
  month: z.string().optional(),
  target_completion_rate: z.number().optional(),
});

export const householdTools: Record<string, ToolDefinition> = {
  get_home_score: {
    description: 'get home score',
    execute: async (context) => {
      const service = getToolService(context);
      const [lists, tasks, completions] = await Promise.all([
        service.from('lists').select('id, list_type').eq('household_id', context.householdId).eq('is_archived', false),
        service.from('tasks').select('list_id, next_due, streak_count').eq('household_id', context.householdId).eq('is_archived', false),
        service.from('completions').select('list_id, completed_at').eq('household_id', context.householdId),
      ]);
      const metrics = computeScoreMetrics(
        mustData(lists.data, lists.error, 'LISTS_FETCH_FAILED'),
        mustData(tasks.data, tasks.error, 'TASKS_FETCH_FAILED'),
        mustData(completions.data, completions.error, 'COMPLETIONS_FETCH_FAILED'),
      );
      const score = calculateHomeScore({
        activeTaskCount: metrics.dueInScoreWindow,
        completedInWindow: metrics.completedInScoreWindow,
        coveredListCount: metrics.coveredListCount,
        dueTaskCount: metrics.dueInScoreWindow,
        listCount: metrics.householdListCount,
        streakAverage: metrics.streakAverage,
      });
      return score;
    },
    schema: { type: 'object', properties: {} },
  },
  get_household: {
    description: 'get household details',
    execute: async (context) => {
      const service = getToolService(context);
      const household = await service.from('households').select('*').eq('id', context.householdId).single();
      const members = await service.from('users').select('id, display_name, role, ring_progress').eq('household_id', context.householdId);
      return {
        household: mustData(household.data, household.error, 'HOUSEHOLD_FETCH_FAILED'),
        members: mustData(members.data, members.error, 'MEMBERS_FETCH_FAILED'),
      };
    },
    schema: { type: 'object', properties: {} },
  },
  get_member_stats: {
    description: 'member completion and ring stats',
    execute: async (context) => {
      const service = getToolService(context);
      const [users, completions] = await Promise.all([
        service.from('users').select('id, display_name, ring_progress, xp_total').eq('household_id', context.householdId),
        service.from('completions').select('completed_by').eq('household_id', context.householdId),
      ]);

      const memberRows = mustData(users.data, users.error, 'USERS_FETCH_FAILED');
      const completionRows = mustData(completions.data, completions.error, 'COMPLETIONS_FETCH_FAILED');
      const grouped = new Map<string, number>();
      completionRows.forEach((item) => grouped.set(item.completed_by, (grouped.get(item.completed_by) ?? 0) + 1));

      return {
        members: memberRows.map((user) => ({
          completions: grouped.get(user.id) ?? 0,
          display_name: user.display_name,
          ring_progress: user.ring_progress,
          user_id: user.id,
          xp_total: user.xp_total,
        })),
      };
    },
    schema: { type: 'object', properties: {} },
  },
  get_monthly_challenge: {
    description: 'get monthly challenge',
    execute: async (context) => {
      const service = getToolService(context);
      const household = await service.from('households').select('monthly_challenge').eq('id', context.householdId).single();
      return { monthly_challenge: mustData(household.data, household.error, 'MONTHLY_FETCH_FAILED').monthly_challenge };
    },
    schema: { type: 'object', properties: {} },
  },
  get_streak_status: {
    description: 'get streak status',
    execute: async (context) => {
      const service = getToolService(context);
      const household = await service.from('households').select('family_streak').eq('id', context.householdId).single();
      const tasks = await service.from('tasks').select('assigned_to, streak_count').eq('household_id', context.householdId).eq('is_archived', false);
      const taskRows = mustData(tasks.data, tasks.error, 'TASKS_FETCH_FAILED');
      const atRisk = taskRows.filter((item) => item.streak_count === 0 && item.assigned_to !== null).map((item) => item.assigned_to);
      return {
        at_risk_members: [...new Set(atRisk)],
        family_streak: mustData(household.data, household.error, 'HOUSEHOLD_FETCH_FAILED').family_streak,
      };
    },
    schema: { type: 'object', properties: {} },
  },
  break_streak: {
    description: 'accept streak break',
    execute: async (context) => {
      requireAdminRole(context.role);
      const service = getToolService(context);
      const [household, actor] = await Promise.all([
        service.from('households').select('family_streak').eq('id', context.householdId).single(),
        service.from('users').select('display_name').eq('id', context.userId).single(),
      ]);
      const previous = mustData(household.data, household.error, 'HOUSEHOLD_FETCH_FAILED').family_streak;
      const actorName = mustData(actor.data, actor.error, 'ACTOR_FETCH_FAILED').display_name;
      await service.from('households').update({ family_streak: 0, streak_last_updated: isoDate() }).eq('id', context.householdId);
      await service.from('feed_events').insert({
        actor_id: context.userId,
        event_type: 'streak_broken',
        household_id: context.householdId,
        payload: { broken_by_name: actorName, previous_streak: previous },
      });
      return { success: true };
    },
    schema: { type: 'object', properties: {} },
  },
  protect_streak: {
    description: 'protect family streak once',
    execute: async (context) => {
      requireAdminRole(context.role);
      const service = getToolService(context);
      await service.from('households').update({ streak_last_updated: isoDate() }).eq('id', context.householdId);
      return { success: true };
    },
    schema: { type: 'object', properties: {} },
  },
  set_monthly_challenge: {
    description: 'set monthly challenge',
    execute: async (context, args) => {
      requireAdminRole(context.role);
      const parsed = monthlySchema.parse(args);
      const service = getToolService(context);
      const updated = await service.from('households').update({ monthly_challenge: parsed }).eq('id', context.householdId);
      if (updated.error !== null) {
        throw updated.error;
      }
      return { success: true };
    },
    schema: {
      type: 'object',
      properties: { goal: { type: 'string' }, target_completion_rate: { type: 'number' }, current_rate: { type: 'number' } },
      required: ['goal'],
    },
  },
};
