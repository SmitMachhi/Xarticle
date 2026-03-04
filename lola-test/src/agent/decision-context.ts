import { SIX, TEN } from '../constants';
import type { UserRow } from '../types';
import { phraseFingerprint } from './copy-policy';

interface ContextList {
  id: string;
  list_type: string;
}

interface ContextHousehold {
  catchup_pending: boolean;
}

interface ContextTask {
  assigned_to: string | null;
  list_id: string;
  next_due: string | null;
}

export const buildDecisionState = (
  user: UserRow,
  household: ContextHousehold,
  tasks: ContextTask[],
  listMap: Map<string, ContextList>,
  recentAssistantTexts: string[],
): string => {
  const today = new Date().toISOString().slice(0, TEN);
  const mine = tasks.filter((task) => task.assigned_to === user.id);
  const dueSoon = mine.filter((task) => task.next_due !== null && task.next_due <= today).length;
  const householdDueSoon = tasks.filter((task) => listMap.get(task.list_id)?.list_type === 'household' && task.next_due !== null && task.next_due <= today).length;
  const fingerprints = recentAssistantTexts.slice(-SIX).map((text) => phraseFingerprint(text));
  return [
    `DECISION.md`,
    `Active constraints: no guilt, no pressure, no internal runtime details`,
    `Current priorities: user_due_now=${dueSoon}, household_due_now=${householdDueSoon}, catchup_pending=${household.catchup_pending}`,
    `Pending action opportunities: ${household.catchup_pending ? 'catchup' : 'none'}`,
    `Recent phrasing fingerprints: ${fingerprints.join('; ') || 'none'}`,
  ].join('\n');
};
