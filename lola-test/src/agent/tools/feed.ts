import { z } from 'zod';

import { THIRTY } from '../../constants';
import { mustData } from '../../lib/supabase';
import type { ToolDefinition } from './shared';
import { getToolService } from './shared';

const sendFeedSchema = z.object({
  event_type: z.string(),
  payload: z.record(z.string(), z.unknown()).default({}),
});

const chatSchema = z.object({
  actions: z
    .array(
      z.object({
        action: z.string(),
        label: z.string(),
        requires_role: z.enum(['admin', 'member']).default('admin'),
      }),
    )
    .optional(),
  content: z.string(),
});

export const feedTools: Record<string, ToolDefinition> = {
  get_feed: {
    description: 'get recent feed events',
    execute: async (context) => {
      const service = getToolService(context);
      const feed = await service.from('feed_events').select('*').eq('household_id', context.householdId).order('created_at', { ascending: false }).limit(THIRTY);
      return { events: mustData(feed.data, feed.error, 'FEED_FETCH_FAILED') };
    },
    schema: { type: 'object', properties: {} },
  },
  send_chat_message: {
    description: 'send private Lola chat message to caller',
    execute: async (context, args) => {
      const parsed = chatSchema.parse(args);
      const service = getToolService(context);
      const inserted = await service
        .from('lola_messages')
        .insert({ actions: parsed.actions ?? null, content: parsed.content, household_id: context.householdId, role: 'lola', user_id: context.userId })
        .select('id')
        .single();
      return { message_id: mustData(inserted.data, inserted.error, 'LOLA_MESSAGE_CREATE_FAILED').id };
    },
    schema: { type: 'object', properties: { content: { type: 'string' } }, required: ['content'] },
  },
  send_feed_message: {
    description: 'create feed event',
    execute: async (context, args) => {
      const parsed = sendFeedSchema.parse(args);
      const service = getToolService(context);
      const inserted = await service
        .from('feed_events')
        .insert({ actor_id: context.userId, event_type: parsed.event_type, household_id: context.householdId, payload: parsed.payload })
        .select('id')
        .single();
      return { event_id: mustData(inserted.data, inserted.error, 'FEED_INSERT_FAILED').id };
    },
    schema: {
      type: 'object',
      properties: { event_type: { type: 'string' }, payload: { type: 'object' } },
      required: ['event_type'],
    },
  },
};
