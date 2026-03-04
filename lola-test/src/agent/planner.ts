import type { LolaPersonality, UserRole } from '../types';
import { plannerOutputSchema, type SpeechAct } from './contracts';

const ACTION_TAG_START = '<actions>';
const ACTION_TAG_END = '</actions>';

interface PlannedResponse {
  actions: Array<{ action: string; label: string; requires_role: UserRole }>;
  draft: string;
  speechAct: SpeechAct;
}

interface PlannerInput {
  draft: string;
  householdName: string;
  personality: LolaPersonality;
  role: UserRole;
  userMessage: string;
}

export const buildPlan = (input: PlannerInput): PlannedResponse => {
  const actions = extractActions(input.draft);
  const cleanedDraft = stripActionsTag(input.draft).trim();
  const parsed = plannerOutputSchema.parse({
    actions,
    draft: cleanedDraft,
    speech_act: {
      audience: input.role === 'admin' ? 'admin' : 'user',
      constraints: ['Preserve concrete facts from the draft.', 'Keep it short and actionable.'],
      facts: {
        household_name: input.householdName,
        role: input.role,
        user_message: input.userMessage,
      },
      intent: 'assistant_reply',
      tone: input.personality,
    },
  });
  return { actions: parsed.actions, draft: parsed.draft, speechAct: parsed.speech_act };
};

const stripActionsTag = (content: string): string => {
  const start = content.indexOf(ACTION_TAG_START);
  const end = content.indexOf(ACTION_TAG_END);
  if (start < 0 || end < 0 || end < start) {
    return content;
  }
  return `${content.slice(0, start)}${content.slice(end + ACTION_TAG_END.length)}`;
};

const extractActions = (content: string): Array<{ action: string; label: string; requires_role: UserRole }> => {
  const startIndex = content.indexOf(ACTION_TAG_START);
  const endIndex = content.indexOf(ACTION_TAG_END);
  if (startIndex < 0 || endIndex < 0) {
    return [];
  }

  const raw = content.slice(startIndex + ACTION_TAG_START.length, endIndex);
  try {
    const parsed = JSON.parse(raw) as Array<{ action: string; label: string; requires_role: UserRole }>;
    return parsed;
  } catch {
    return [];
  }
};
