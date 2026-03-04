import { z } from 'zod';

export const domainEventTypeSchema = z.enum([
  'badge_awarded',
  'catchup_prompt',
  'household_created',
  'list_type_changed',
  'member_joined',
  'streak_admin_prompt',
  'streak_warning',
  'task_assigned',
  'task_completed',
  'weekly_recap',
]);

export type DomainEventType = z.infer<typeof domainEventTypeSchema>;

export const domainEventSchema = z.object({
  actions: z
    .array(
      z.object({
        action: z.string(),
        label: z.string(),
        requires_role: z.enum(['admin', 'member']),
      }),
    )
    .optional(),
  actor_user_id: z.string().optional(),
  audience_user_ids: z.array(z.string()).optional(),
  facts: z.record(z.string(), z.unknown()).default({}),
  household_id: z.string(),
  type: domainEventTypeSchema,
});

export type DomainEvent = z.infer<typeof domainEventSchema>;

export const deliveryDecisionSchema = z.object({
  actions: z
    .array(
      z.object({
        action: z.string(),
        label: z.string(),
        requires_role: z.enum(['admin', 'member']),
      }),
    )
    .default([]),
  chat_user_ids: z.array(z.string()).default([]),
  push_exclude_user_id: z.string().nullable().default(null),
  push_household: z.boolean().default(false),
  push_user_ids: z.array(z.string()).default([]),
  silent: z.boolean().default(false),
});

export type DeliveryDecision = z.infer<typeof deliveryDecisionSchema>;

export const speechActSchema = z.object({
  audience: z.enum(['admin', 'household', 'user']),
  constraints: z.array(z.string()).default([]),
  facts: z.record(z.string(), z.unknown()).default({}),
  intent: z.string(),
  tone: z.enum(['balanced', 'calm', 'sassy']),
});

export type SpeechAct = z.infer<typeof speechActSchema>;

export const realizedMessageSchema = z.object({
  body: z.string(),
  push_body: z.string().optional(),
  push_title: z.string().optional(),
});

export type RealizedMessage = z.infer<typeof realizedMessageSchema>;

export const runPolicySchema = z.object({
  banned_phrases: z.array(z.string()).default([]),
  max_chars: z.number().int().positive(),
  tone_constraints: z.array(z.string()).default([]),
});

export type RunPolicy = z.infer<typeof runPolicySchema>;

export const plannerOutputSchema = z.object({
  actions: z
    .array(
      z.object({
        action: z.string(),
        label: z.string(),
        requires_role: z.enum(['admin', 'member']),
      }),
    )
    .default([]),
  draft: z.string(),
  speech_act: speechActSchema,
});

export const realizerOutputSchema = z.object({
  body: z.string(),
});
