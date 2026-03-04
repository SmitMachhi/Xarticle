import { z } from 'zod';

import { awardBadgeIfMissing } from '../../lib/gamification';
import type { ToolDefinition } from './shared';
import { getToolService } from './shared';

const awardSchema = z.object({
  badge_key: z.enum([
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
  ]),
  user_id: z.string(),
});

export const gamificationTools: Record<string, ToolDefinition> = {
  award_badge: {
    description: 'award badge to user',
    execute: async (context, args) => {
      const parsed = awardSchema.parse(args);
      const service = getToolService(context);
      await awardBadgeIfMissing(service, context.householdId, parsed.user_id, parsed.badge_key, context.env);
      return { success: true };
    },
    schema: {
      type: 'object',
      properties: { badge_key: { type: 'string' }, user_id: { type: 'string' } },
      required: ['user_id', 'badge_key'],
    },
  },
};
