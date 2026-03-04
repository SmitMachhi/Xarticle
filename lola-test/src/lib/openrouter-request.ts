import { AGENT_TIMEOUT_MS, HTTP_BAD_REQUEST, HTTP_INTERNAL_ERROR } from '../constants';
import type { EnvBindings, OpenRouterMessage } from '../types';
import { toAppError } from './http';

export type OpenRouterUseCase = 'chat' | 'json_classification' | 'json_suggestion' | 'realizer';

interface PostChatInput {
  messages: OpenRouterMessage[];
  responseFormat?: { type: 'json_object' } | undefined;
  stream: boolean;
  tools?: unknown[] | undefined;
  useCase: OpenRouterUseCase;
  withReasoningControls: boolean;
}

export const isJsonUseCase = (useCase: OpenRouterUseCase): boolean => {
  return useCase === 'json_classification' || useCase === 'json_suggestion';
};

export const postChatCompletion = async (env: EnvBindings, input: PostChatInput): Promise<Response> => {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | null = null;
  const body = {
    include_reasoning: input.withReasoningControls ? false : undefined,
    messages: input.messages,
    model: selectModel(env, input.useCase),
    reasoning: input.withReasoningControls ? { enabled: false } : undefined,
    reasoning_effort: input.withReasoningControls ? selectJsonReasoningEffort(env) : undefined,
    response_format: input.responseFormat,
    stream: input.stream,
    tools: input.tools,
  };

  try {
    const fetchPromise = fetch('https://openrouter.ai/api/v1/chat/completions', {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
    }).catch(() => {
      throw toAppError('OPENROUTER_UNREACHABLE', 'openrouter call failed', HTTP_INTERNAL_ERROR);
    });

    const timeoutPromise = new Promise<Response>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(toAppError('OPENROUTER_TIMEOUT', 'openrouter timed out', HTTP_BAD_REQUEST));
      }, AGENT_TIMEOUT_MS);
    });

    return await Promise.race([fetchPromise, timeoutPromise]);
  } finally {
    if (timer !== null) {
      clearTimeout(timer);
    }
  }
};

const selectModel = (env: EnvBindings, useCase: OpenRouterUseCase): string => {
  if (isJsonUseCase(useCase)) {
    return env.OPENROUTER_JSON_MODEL || env.OPENROUTER_CHAT_MODEL || env.OPENROUTER_MODEL;
  }
  return env.OPENROUTER_CHAT_MODEL || env.OPENROUTER_MODEL;
};

const selectJsonReasoningEffort = (env: EnvBindings): string => {
  return env.OPENROUTER_REASONING_EFFORT_JSON || 'low';
};
