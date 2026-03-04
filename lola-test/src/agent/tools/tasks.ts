import { z } from 'zod';

import { HTTP_BAD_REQUEST, HTTP_FORBIDDEN, ROLE_MEMBER } from '../../constants';
import { toAppError } from '../../lib/http';
import { mustData } from '../../lib/supabase';
import { completeTaskWithEffects } from '../../lib/task-completion';
import { assertAssignable, assertTaskEditAllowed, claimTaskFlow } from '../../lib/tasks';
import type { ToolDefinition } from './shared';
import { getToolService, requireAdminRole } from './shared';
import { notifyTaskAssigned } from './task-notify';

const listSchema = z.object({
  assigned_to: z.string().optional(),
  list_id: z.string().optional(),
  up_for_grabs: z.boolean().optional(),
});

const createSchema = z.object({
  assigned_to: z.string().nullable().optional(),
  category: z.string().optional(),
  effort_points: z.number().int().optional(),
  interval_days: z.number().int().nullable().optional(),
  is_up_for_grabs: z.boolean().optional(),
  list_id: z.string(),
  next_due: z.string().optional(),
  recurrence_type: z.string().optional(),
  reminder_time: z.string().optional(),
  title: z.string(),
});

const updateSchema = createSchema.partial().extend({ task_id: z.string() });
const idSchema = z.object({ task_id: z.string() });
const completeSchema = z.object({ photo_url: z.string().optional(), task_id: z.string(), was_catchup: z.boolean().optional() });
const reminderSchema = z.object({ reminder_time: z.string(), task_id: z.string() });

export const taskTools: Record<string, ToolDefinition> = {
  archive_task: {
    description: 'archive task',
    execute: async (context, args) => {
      const parsed = idSchema.parse(args);
      const service = getToolService(context);
      const existing = await service.from('tasks').select('*').eq('id', parsed.task_id).eq('household_id', context.householdId).maybeSingle();
      const task = mustData(existing.data, existing.error, 'TASK_NOT_FOUND');
      if (context.role === ROLE_MEMBER && task.assigned_to !== context.userId) {
        throw toAppError('TASK_ARCHIVE_FORBIDDEN', 'members can archive only their tasks', HTTP_FORBIDDEN);
      }
      const archived = await service.from('tasks').update({ is_archived: true }).eq('id', parsed.task_id).eq('household_id', context.householdId);
      if (archived.error !== null) {
        throw toAppError('ARCHIVE_TASK_FAILED', archived.error.message, HTTP_BAD_REQUEST);
      }
      return { success: true };
    },
    schema: { type: 'object', properties: { task_id: { type: 'string' } }, required: ['task_id'] },
  },
  assign_task: {
    description: 'assign task to member',
    execute: async (context, args) => {
      requireAdminRole(context.role);
      const parsed = z.object({ assigned_to: z.string(), task_id: z.string() }).parse(args);
      const service = getToolService(context);
      const existing = await service.from('tasks').select('assigned_to, title').eq('id', parsed.task_id).eq('household_id', context.householdId).maybeSingle();
      const task = mustData(existing.data, existing.error, 'TASK_NOT_FOUND');
      const updated = await service
        .from('tasks')
        .update({ assigned_to: parsed.assigned_to, is_up_for_grabs: false })
        .eq('id', parsed.task_id)
        .eq('household_id', context.householdId)
        .select('*')
        .single();
      if (parsed.assigned_to !== task.assigned_to) {
        await notifyTaskAssigned(context.env, service, context.householdId, parsed.assigned_to, task.title);
      }
      return { task: mustData(updated.data, updated.error, 'ASSIGN_TASK_FAILED') };
    },
    schema: {
      type: 'object',
      properties: { assigned_to: { type: 'string' }, task_id: { type: 'string' } },
      required: ['task_id', 'assigned_to'],
    },
  },
  claim_task: {
    description: 'claim up-for-grabs task',
    execute: async (context, args) => {
      const parsed = idSchema.parse(args);
      const service = getToolService(context);
      const task = await claimTaskFlow(service, parsed.task_id, context.userId, context.householdId);
      return { task };
    },
    schema: { type: 'object', properties: { task_id: { type: 'string' } }, required: ['task_id'] },
  },
  complete_task: {
    description: 'complete task',
    execute: async (context, args) => {
      const parsed = completeSchema.parse(args);
      const service = getToolService(context);
      const existing = await service.from('tasks').select('*').eq('id', parsed.task_id).eq('household_id', context.householdId).maybeSingle();
      const task = mustData(existing.data, existing.error, 'TASK_NOT_FOUND');
      const completed = await completeTaskWithEffects({
        actorId: context.userId,
        env: context.env,
        photoUrl: parsed.photo_url,
        service,
        task,
        wasCatchup: parsed.was_catchup ?? false,
      });
      return completed;
    },
    schema: {
      type: 'object',
      properties: { photo_url: { type: 'string' }, task_id: { type: 'string' }, was_catchup: { type: 'boolean' } },
      required: ['task_id'],
    },
  },
  create_task: {
    description: 'create a task',
    execute: async (context, args) => {
      const parsed = createSchema.parse(args);
      const service = getToolService(context);
      assertAssignable(context.role, context.userId, parsed.assigned_to);
      const created = await service
        .from('tasks')
        .insert({ created_by: context.userId, household_id: context.householdId, ...parsed })
        .select('*')
        .single();
      const task = mustData(created.data, created.error, 'CREATE_TASK_FAILED');
      if (task.assigned_to !== null) {
        await notifyTaskAssigned(context.env, service, context.householdId, task.assigned_to, task.title);
      }
      return { task };
    },
    schema: { type: 'object', properties: { title: { type: 'string' }, list_id: { type: 'string' } }, required: ['title', 'list_id'] },
  },
  get_tasks: {
    description: 'fetch household tasks',
    execute: async (context, args) => {
      const parsed = listSchema.parse(args);
      const service = getToolService(context);
      let query = service.from('tasks').select('*').eq('household_id', context.householdId).eq('is_archived', false);
      if (parsed.list_id !== undefined) {
        query = query.eq('list_id', parsed.list_id);
      }
      if (parsed.assigned_to !== undefined) {
        query = query.eq('assigned_to', parsed.assigned_to);
      }
      if (parsed.up_for_grabs !== undefined) {
        query = query.eq('is_up_for_grabs', parsed.up_for_grabs);
      }
      const tasks = await query.order('next_due', { ascending: true });
      return { tasks: mustData(tasks.data, tasks.error, 'GET_TASKS_FAILED') };
    },
    schema: { type: 'object', properties: { list_id: { type: 'string' }, assigned_to: { type: 'string' }, up_for_grabs: { type: 'boolean' } } },
  },
  set_reminder: {
    description: 'set reminder for task',
    execute: async (context, args) => {
      const parsed = reminderSchema.parse(args);
      const service = getToolService(context);
      const updated = await service.from('tasks').update({ reminder_time: parsed.reminder_time }).eq('id', parsed.task_id).eq('household_id', context.householdId);
      if (updated.error !== null) {
        throw toAppError('SET_REMINDER_FAILED', updated.error.message, HTTP_BAD_REQUEST);
      }
      return { success: true };
    },
    schema: {
      type: 'object',
      properties: { reminder_time: { type: 'string' }, task_id: { type: 'string' } },
      required: ['task_id', 'reminder_time'],
    },
  },
  update_task: {
    description: 'update task fields',
    execute: async (context, args) => {
      const parsed = updateSchema.parse(args);
      const service = getToolService(context);
      const { task_id: taskId, ...patch } = parsed;
      const existing = await service.from('tasks').select('*').eq('id', taskId).eq('household_id', context.householdId).maybeSingle();
      const task = mustData(existing.data, existing.error, 'TASK_NOT_FOUND');
      assertTaskEditAllowed(context.role, context.userId, task);
      assertAssignable(context.role, context.userId, patch.assigned_to);
      const updated = await service.from('tasks').update(patch).eq('id', taskId).eq('household_id', context.householdId).select('*').single();
      const nextTask = mustData(updated.data, updated.error, 'UPDATE_TASK_FAILED');
      if (nextTask.assigned_to !== null && nextTask.assigned_to !== task.assigned_to) {
        await notifyTaskAssigned(context.env, service, context.householdId, nextTask.assigned_to, nextTask.title);
      }
      return { task: nextTask };
    },
    schema: { type: 'object', properties: { task_id: { type: 'string' } }, required: ['task_id'] },
  },
};
