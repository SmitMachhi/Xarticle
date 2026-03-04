import {
  type OnboardSuggestionPayload,
  onboardSuggestionPayloadSchema,
} from '../agent/onboard-suggestions';
import { HTTP_BAD_REQUEST } from '../constants';
import type { EnvBindings } from '../types';
import { toAppError } from './http';
import { getUserClient, mustData } from './supabase';

export interface OnboardApplyInput {
  selected_list_ids: string[];
  selected_task_ids: string[];
}
export const applyOnboardSuggestions = async (
  env: EnvBindings,
  accessToken: string,
  userId: string,
  jobId: string,
  body: OnboardApplyInput,
  idempotencyKey: string,
) => {
  const userClient = getUserClient(env, accessToken);
  const existing = await userClient
    .from('onboarding_suggestion_applies')
    .select('created_list_ids, created_task_ids')
    .eq('job_id', jobId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (existing.error === null && existing.data !== null) {
    return readExistingApply(existing.data.created_list_ids, existing.data.created_task_ids);
  }

  const selection = await buildSuggestionSelection(userClient, jobId, body);
  const createdLists = await insertSelectedLists(userClient, userId, selection.householdId, selection.selectedLists);
  const listIdMap = buildListIdMap(selection.selectedLists, createdLists);
  const createdTasks = await insertSelectedTasks(userClient, userId, selection.householdId, selection.selectedTasks, listIdMap);
  await recordApply(userClient, jobId, idempotencyKey, userId, selection.householdId, body, createdLists, createdTasks);

  return {
    created_list_map: selection.selectedLists.map((list) => ({ list_id: listIdMap.get(list.id) ?? '', suggestion_list_id: list.id })),
    lists_created: createdLists.length,
    tasks_created: createdTasks.length,
  };
};

const buildSuggestionSelection = async (
  userClient: ReturnType<typeof getUserClient>,
  jobId: string,
  body: OnboardApplyInput,
) => {
  const jobQuery = await userClient.from('onboarding_suggestion_jobs').select('household_id, status, suggestions').eq('id', jobId).maybeSingle();
  const job = mustData(jobQuery.data, jobQuery.error, 'ONBOARD_JOB_NOT_FOUND');
  if (job.status !== 'ready') {
    throw toAppError('ONBOARD_JOB_NOT_READY', 'suggestions are not ready', HTTP_BAD_REQUEST);
  }
  const parsedSuggestions = onboardSuggestionPayloadSchema.safeParse(job.suggestions);
  if (!parsedSuggestions.success) {
    throw toAppError('ONBOARD_SUGGESTIONS_INVALID', 'invalid suggestions payload', HTTP_BAD_REQUEST);
  }
  const selectedLists = parsedSuggestions.data.lists.filter((list) => body.selected_list_ids.includes(list.id));
  const selectedListIds = new Set(selectedLists.map((list) => list.id));
  const selectedTasks = parsedSuggestions.data.tasks.filter((task) => body.selected_task_ids.includes(task.id) && selectedListIds.has(task.list_id));
  return { householdId: job.household_id, selectedLists, selectedTasks };
};

const insertSelectedLists = async (
  userClient: ReturnType<typeof getUserClient>,
  userId: string,
  householdId: string,
  selectedLists: OnboardSuggestionPayload['lists'],
) => {
  const payload = selectedLists.map((list) => ({
    color: list.color ?? '#7CB99A',
    created_by: userId,
    emoji: list.emoji ?? null,
    household_id: householdId,
    list_type: list.list_type,
    name: list.name,
  }));
  const inserted = payload.length === 0 ? { data: [], error: null } : await userClient.from('lists').insert(payload).select('id');
  return mustData(inserted.data, inserted.error, 'ONBOARD_LIST_APPLY_FAILED');
};

const buildListIdMap = (selectedLists: OnboardSuggestionPayload['lists'], createdLists: Array<{ id: string }>) => {
  return new Map(selectedLists.map((list, index) => [list.id, createdLists[index]?.id ?? '']));
};

const insertSelectedTasks = async (
  userClient: ReturnType<typeof getUserClient>,
  userId: string,
  householdId: string,
  selectedTasks: OnboardSuggestionPayload['tasks'],
  listIdMap: Map<string, string>,
) => {
  const payload = selectedTasks
    .map((task) => {
      const listId = listIdMap.get(task.list_id);
      if (listId === undefined || listId.length === 0) {
        return null;
      }
      return {
        assigned_to: null,
        category: task.category ?? 'other',
        created_by: userId,
        effort_points: task.effort_points ?? 2,
        household_id: householdId,
        interval_days: task.interval_days ?? null,
        list_id: listId,
        recurrence_type: task.recurrence_type,
        title: task.title,
      };
    })
    .filter((item): item is Exclude<typeof item, null> => item !== null);
  const inserted = payload.length === 0 ? { data: [], error: null } : await userClient.from('tasks').insert(payload).select('id');
  return mustData(inserted.data, inserted.error, 'ONBOARD_TASK_APPLY_FAILED');
};

const recordApply = async (
  userClient: ReturnType<typeof getUserClient>,
  jobId: string,
  idempotencyKey: string,
  userId: string,
  householdId: string,
  body: OnboardApplyInput,
  createdLists: Array<{ id: string }>,
  createdTasks: Array<{ id: string }>,
) => {
  const inserted = await userClient.from('onboarding_suggestion_applies').insert({
    applied_by: userId,
    created_list_ids: createdLists.map((list) => list.id),
    created_task_ids: createdTasks.map((task) => task.id),
    household_id: householdId,
    idempotency_key: idempotencyKey,
    job_id: jobId,
    selected_list_ids: body.selected_list_ids,
    selected_task_ids: body.selected_task_ids,
  });
  if (inserted.error !== null) {
    throw toAppError('ONBOARD_APPLY_FAILED', inserted.error.message, HTTP_BAD_REQUEST);
  }
};

const readExistingApply = (createdListIdsRaw: unknown, createdTaskIdsRaw: unknown) => {
  const createdListIds = readStringArray(createdListIdsRaw);
  const createdTaskIds = readStringArray(createdTaskIdsRaw);
  return { created_list_map: [], lists_created: createdListIds.length, tasks_created: createdTaskIds.length };
};

const readStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
};
