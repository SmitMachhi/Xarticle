import { z } from 'zod';

import { runOpenRouterJson } from '../lib/openrouter';
import type { EnvBindings, OpenRouterMessage } from '../types';
import { ONBOARD_SUGGESTIONS_PROMPT } from './prompts/onboard-suggestions';

const LIST_TYPE = z.enum(['household', 'personal', 'project']);
const FALLBACK_TASK_LIMIT = 8;
const MAX_LIST_COUNT = 3;
const MAX_TASK_COUNT = 10;
const MAX_TASK_EFFORT = 5;
const MIN_LIST_COUNT = 2;
const MIN_TASK_COUNT = 6;

const suggestionSchema = z.object({
  lists: z.array(
    z.object({
      color: z.string().nullable().optional(),
      emoji: z.string().nullable().optional(),
      id: z.string().min(1),
      list_type: LIST_TYPE.default('household'),
      name: z.string().min(1),
    }),
  ),
  tasks: z.array(
    z.object({
      category: z.string().nullable().optional(),
      effort_points: z.number().int().min(1).max(MAX_TASK_EFFORT).nullable().optional(),
      id: z.string().min(1),
      interval_days: z.number().int().min(1).nullable().optional(),
      list_id: z.string().min(1),
      rationale: z.string().nullable().optional(),
      recurrence_type: z.string().min(1).default('weekly'),
      suggested_assignee: z.string().nullable().optional(),
      title: z.string().min(1),
    }),
  ),
});

interface CandidateCatalog {
  lists: Array<{ color?: string; emoji?: string; id: string; list_type: 'household' | 'personal' | 'project'; name: string }>;
  tasks: Array<{
    category?: string;
    effort_points?: number;
    id: string;
    interval_days?: number | null;
    list_id: string;
    recurrence_type: string;
    suggested_assignee?: string;
    title: string;
  }>;
}

export interface OnboardSuggestionInput {
  has_kids: boolean;
  home_type: string;
  household_id: string;
  num_people: number;
  struggle_area: string;
}

export type OnboardSuggestionPayload = z.infer<typeof suggestionSchema>;
export const onboardSuggestionPayloadSchema = suggestionSchema;

export const generateOnboardSuggestions = async (
  env: EnvBindings,
  input: OnboardSuggestionInput,
): Promise<OnboardSuggestionPayload> => {
  const catalog = selectCatalog(input.struggle_area, input.has_kids);
  const messages: OpenRouterMessage[] = [
    { content: ONBOARD_SUGGESTIONS_PROMPT, role: 'system' },
    {
      content: JSON.stringify({
        candidate_catalog: catalog,
        household_profile: {
          has_kids: input.has_kids,
          home_type: input.home_type,
          num_people: input.num_people,
          struggle_area: input.struggle_area,
        },
      }),
      role: 'user',
    },
  ];

  try {
    const raw = await runOpenRouterJson<unknown>(env, messages);
    return normalizeSuggestions(suggestionSchema.parse(raw), catalog);
  } catch {
    return fallbackSuggestions(catalog);
  }
};

const selectCatalog = (struggleArea: string, hasKids: boolean): CandidateCatalog => {
  const keyword = struggleArea.toLowerCase();
  const base = buildBaseCatalog();

  if (keyword.includes('kitchen')) {
    return {
      ...base,
      lists: [base.lists[0], base.lists[1], base.lists[3]].filter(
        (list): list is NonNullable<typeof list> => list !== undefined,
      ),
      tasks: base.tasks.filter((task) => task.list_id !== 'laundry-flow'),
    };
  }
  if (keyword.includes('laundry')) {
    return {
      ...base,
      lists: [base.lists[0], base.lists[1], base.lists[2]].filter(
        (list): list is NonNullable<typeof list> => list !== undefined,
      ),
      tasks: base.tasks.filter((task) => task.list_id !== 'kitchen-reset'),
    };
  }
  if (!hasKids) {
    return base;
  }

  return {
    lists: base.lists,
    tasks: [
      ...base.tasks,
      { category: 'school', effort_points: 1, id: 'kids-bag-reset', list_id: 'weekly-reset', recurrence_type: 'weekly', suggested_assignee: 'kids', title: 'Kids backpack reset' },
      { category: 'tidying', effort_points: 1, id: 'kids-shared-pickup', list_id: 'home-core', recurrence_type: 'weekly', suggested_assignee: 'kids', title: '10-minute shared pickup' },
    ],
  };
};

const normalizeSuggestions = (parsed: OnboardSuggestionPayload, catalog: CandidateCatalog): OnboardSuggestionPayload => {
  const catalogListIds = new Set(catalog.lists.map((list) => list.id));
  const lists = dedupeById(parsed.lists).filter((list) => catalogListIds.has(list.id)).slice(0, MAX_LIST_COUNT);
  const activeListIds = new Set(lists.map((list) => list.id));
  const tasks = dedupeById(parsed.tasks).filter((task) => activeListIds.has(task.list_id)).slice(0, MAX_TASK_COUNT);
  if (lists.length < MIN_LIST_COUNT || tasks.length < MIN_TASK_COUNT) {
    return fallbackSuggestions(catalog);
  }
  return { lists, tasks };
};

const fallbackSuggestions = (catalog: CandidateCatalog): OnboardSuggestionPayload => {
  const lists = catalog.lists.slice(0, MAX_LIST_COUNT);
  const activeListIds = new Set(lists.map((list) => list.id));
  const tasks = catalog.tasks.filter((task) => activeListIds.has(task.list_id)).slice(0, FALLBACK_TASK_LIMIT);
  return { lists, tasks };
};

const buildBaseCatalog = (): CandidateCatalog => {
  return {
    lists: [
      { color: '#7CB99A', emoji: '🏠', id: 'home-core', list_type: 'household', name: 'Home Core' },
      { color: '#F2C66D', emoji: '🗓️', id: 'weekly-reset', list_type: 'household', name: 'Weekly Reset' },
      { color: '#9DB5E5', emoji: '🧺', id: 'laundry-flow', list_type: 'household', name: 'Laundry Flow' },
      { color: '#F4A6A6', emoji: '🍳', id: 'kitchen-reset', list_type: 'household', name: 'Kitchen Reset' },
    ],
    tasks: [
      { category: 'tidying', effort_points: 2, id: 'reset-surfaces', list_id: 'home-core', recurrence_type: 'weekly', title: 'Reset shared surfaces' },
      { category: 'hygiene', effort_points: 2, id: 'bathroom-quick', list_id: 'home-core', recurrence_type: 'weekly', title: 'Quick bathroom refresh' },
      { category: 'laundry', effort_points: 2, id: 'sort-laundry', list_id: 'laundry-flow', recurrence_type: 'weekly', title: 'Sort and start laundry cycle' },
      { category: 'laundry', effort_points: 2, id: 'fold-laundry', list_id: 'laundry-flow', recurrence_type: 'weekly', title: 'Fold and put away laundry' },
      { category: 'kitchen', effort_points: 2, id: 'stovetop-wipe', list_id: 'kitchen-reset', recurrence_type: 'weekly', title: 'Wipe stovetop and counters' },
      { category: 'kitchen', effort_points: 2, id: 'fridge-scan', list_id: 'kitchen-reset', recurrence_type: 'weekly', title: 'Quick fridge check and toss' },
      { category: 'other', effort_points: 1, id: 'supplies-check', list_id: 'weekly-reset', recurrence_type: 'weekly', title: 'Check household supplies' },
      { category: 'maintenance', effort_points: 2, id: 'trash-route', list_id: 'weekly-reset', recurrence_type: 'weekly', title: 'Take out trash and recycling' },
      { category: 'tidying', effort_points: 1, id: 'entry-reset', list_id: 'home-core', recurrence_type: 'weekly', title: 'Reset entryway and shoes' },
      { category: 'hygiene', effort_points: 1, id: 'mirror-wipe', list_id: 'home-core', recurrence_type: 'weekly', title: 'Wipe mirrors' },
    ],
  };
};

const dedupeById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
};
