import {
  AGENT_LOOP_TIMEOUT_MS,
  AGENT_MAX_ITERATIONS,
  CONTEXT_WINDOW_SOFT_LIMIT,
  MAX_TOOL_RESULT_CHARS,
  STORAGE_TRANSCRIPT_PATH,
  TEN,
} from '../constants';
import { runOpenRouterChat } from '../lib/openrouter';
import { getServiceClient } from '../lib/supabase';
import type { EnvBindings, OpenRouterMessage, UserRole } from '../types';
import { compactMemoryIfNeeded } from './compaction';
import { assembleContext } from './context';
import { buildRunPolicy } from './copy-policy';
import { FALLBACK_COPY } from './fallback-copy';
import { buildPlan } from './planner';
import { realizeText } from './realizer';
import { executeTool, getToolSchemas } from './tools';

export interface LolaRunInput {
  householdId: string;
  onDelta?: (_chunk: string) => Promise<void>;
  role: UserRole;
  userId: string;
  userMessage: string;
}

export interface LolaRunResult {
  actions: Array<{ action: string; label: string; requires_role: UserRole }>;
  text: string;
}

export const runLolaLoop = async (env: EnvBindings, input: LolaRunInput): Promise<LolaRunResult> => {
  const context = await assembleContext(env, input.userId);
  const messages: OpenRouterMessage[] = [...context.messages, { content: input.userMessage, role: 'user' }];
  const transcript: Array<Record<string, unknown>> = [];
  const startedAt = Date.now();
  const result: LolaRunResult = { actions: [], text: '' };

  for (let index = 0; index < AGENT_MAX_ITERATIONS; index += 1) {
    if (isTimedOut(startedAt)) {
      result.text = FALLBACK_COPY.LOOP_RECOVERY;
      transcript.push({ role: 'assistant_timeout' });
      break;
    }

    const model = await runOpenRouterChat(env, { messages, tools: getToolSchemas() });
    if (model.toolCalls.length === 0) {
      const planned = await resolveNoToolResponse(env, input, context, model.content);
      result.actions = planned.actions;
      result.text = planned.text;
      transcript.push({ actions: result.actions.length, content: result.text, role: 'assistant_realized' });
      break;
    }
    if (isContextNearLimit(model.promptTokens)) {
      result.text = FALLBACK_COPY.LOOP_RECOVERY;
      transcript.push({ prompt_tokens: model.promptTokens, role: 'assistant_context_limit' });
      break;
    }

    transcript.push({ content: model.content, role: 'assistant' });
    await applyToolCalls(env, input, messages, model.toolCalls, transcript);
  }

  if (result.text.length === 0) {
    result.text = FALLBACK_COPY.LOOP_RECOVERY;
  }

  await persistTranscript(env, input.userId, transcript).catch(() => undefined);
  await compactMemoryIfNeeded(env, input.userId).catch(() => undefined);
  return result;
};

const isTimedOut = (startedAt: number): boolean => {
  return Date.now() - startedAt > AGENT_LOOP_TIMEOUT_MS;
};

const isContextNearLimit = (promptTokens: number | null): boolean => {
  return promptTokens !== null && promptTokens > CONTEXT_WINDOW_SOFT_LIMIT;
};

const resolveNoToolResponse = async (
  env: EnvBindings,
  input: LolaRunInput,
  context: Awaited<ReturnType<typeof assembleContext>>,
  content: string,
): Promise<LolaRunResult> => {
  const plan = buildPlan({
    draft: content,
    householdName: context.householdName,
    personality: context.personality,
    role: input.role,
    userMessage: input.userMessage,
  });
  const text = await realizeText(env, {
    draft: plan.draft.length === 0 ? FALLBACK_COPY.LOOP_RECOVERY : plan.draft,
    policy: buildRunPolicy(context.personality, 'chat'),
    recentAssistantTexts: context.recentAssistantTexts,
    speechAct: plan.speechAct,
    ...(input.onDelta === undefined ? {} : { onDelta: input.onDelta }),
  }).catch(async () => {
    if (input.onDelta !== undefined) {
      await input.onDelta(FALLBACK_COPY.LOOP_RECOVERY);
    }
    return FALLBACK_COPY.LOOP_RECOVERY;
  });
  return { actions: plan.actions, text };
};

const applyToolCalls = async (
  env: EnvBindings,
  input: LolaRunInput,
  messages: OpenRouterMessage[],
  calls: Array<{ arguments: Record<string, unknown>; id: string; name: string }>,
  transcript: Array<Record<string, unknown>>,
): Promise<void> => {
  for (const call of calls) {
    const result = await executeTool(
      { env, householdId: input.householdId, role: input.role, userId: input.userId },
      call.name,
      call.arguments,
    );
    const serialized = serializeToolResult(result);
    transcript.push({ role: 'tool', tool: call.name, tool_result: result });
    messages.push(buildAssistantToolCallMessage(call.name, call.id, call.arguments));
    messages.push({ content: truncateToolResult(serialized), role: 'tool', tool_call_id: call.id });
  }
};

const serializeToolResult = (result: unknown): string => {
  const serialized = JSON.stringify(result);
  return serialized === undefined ? 'null' : serialized;
};

const truncateToolResult = (value: string): string => {
  if (value.length <= MAX_TOOL_RESULT_CHARS) {
    return value;
  }
  return `${value.slice(0, MAX_TOOL_RESULT_CHARS)}...[result truncated, ${value.length} chars total]`;
};

const buildAssistantToolCallMessage = (
  name: string,
  id: string,
  args: Record<string, unknown>,
): OpenRouterMessage => {
  return {
    content: '',
    role: 'assistant',
    tool_calls: [
      {
        function: { arguments: JSON.stringify(args), name },
        id,
        type: 'function',
      },
    ],
  };
};

const persistTranscript = async (
  env: EnvBindings,
  userId: string,
  transcript: Array<Record<string, unknown>>,
): Promise<void> => {
  const service = getServiceClient(env);
  const date = new Date().toISOString().slice(0, TEN);
  const lines = transcript.map((item) => JSON.stringify({ timestamp: new Date().toISOString(), ...item })).join('\n');
  await service.storage.from(STORAGE_TRANSCRIPT_PATH).upload(`${userId}/${date}.jsonl`, new Blob([lines]), {
    contentType: 'application/jsonl',
    upsert: true,
  });
};
