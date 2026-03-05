import { z } from 'zod';

import { HTTP_BAD_REQUEST } from '../../constants';
import { toAppError } from '../../lib/http';
import { mustData } from '../../lib/supabase';
import type { ToolDefinition } from './shared';
import { getToolService, requireAdminRole } from './shared';

const createSchema = z.object({
  color: z.string().optional(),
  emoji: z.string().optional(),
  list_type: z.enum(['household', 'personal', 'project']).optional(),
  name: z.string(),
});

const updateSchema = createSchema.partial().extend({ list_id: z.string() });

export const listTools: Record<string, ToolDefinition> = {
  create_list: {
    description: 'create a new list (household, personal, or project type)',
    execute: async (context, args) => {
      const parsed = createSchema.parse(args);
      const service = getToolService(context);
      const created = await service
        .from('lists')
        .insert({ created_by: context.userId, household_id: context.householdId, ...parsed })
        .select('*')
        .single();
      return { list: mustData(created.data, created.error, 'CREATE_LIST_FAILED') };
    },
    schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
  },
  get_lists: {
    description: 'get all active household lists with their IDs and types; always call this before creating tasks',
    execute: async (context) => {
      const service = getToolService(context);
      const lists = await service.from('lists').select('*').eq('household_id', context.householdId).eq('is_archived', false);
      return { lists: mustData(lists.data, lists.error, 'GET_LISTS_FAILED') };
    },
    schema: { type: 'object', properties: {} },
  },
  update_list: {
    description: 'update list name, emoji, color, or type (changing type requires admin)',
    execute: async (context, args) => {
      const parsed = updateSchema.parse(args);
      const service = getToolService(context);
      const current = await service.from('lists').select('list_type').eq('id', parsed.list_id).maybeSingle();
      const currentType = mustData(current.data, current.error, 'LIST_NOT_FOUND').list_type;
      if (parsed.list_type !== undefined && parsed.list_type !== currentType) {
        requireAdminRole(context.role);
      }

      const { list_id: listId, ...patch } = parsed;
      const updated = await service.from('lists').update(patch).eq('id', listId).eq('household_id', context.householdId).select('*').single();
      if (updated.error !== null || updated.data === null) {
        throw toAppError('UPDATE_LIST_FAILED', updated.error?.message ?? 'update failed', HTTP_BAD_REQUEST);
      }
      return { list: updated.data };
    },
    schema: {
      type: 'object',
      properties: { list_id: { type: 'string' }, name: { type: 'string' }, list_type: { type: 'string' } },
      required: ['list_id'],
    },
  },
};
