import { AGENT_TIMEOUT_MS, HTTP_BAD_REQUEST, HTTP_INTERNAL_ERROR } from '../constants';
import type { EnvBindings, OpenRouterMessage } from '../types';
import { toAppError } from './http';

export const MINIMAX_MODEL = 'minimax/minimax-m2.5';

interface PostChatInput {
  messages: OpenRouterMessage[];
  responseFormat?: { type: 'json_object' } | undefined;
  stream: boolean;
  tools?: unknown[] | undefined;
}

export const postChatCompletion = async (env: EnvBindings, input: PostChatInput): Promise<Response> => {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | null = null;
  const body = {
    messages: input.messages,
    model: MINIMAX_MODEL,
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
