import { HTTP_BAD_REQUEST, HTTP_INTERNAL_ERROR } from '../constants';
import type { EnvBindings, OpenRouterMessage, ToolCall } from '../types';
import { toAppError } from './http';
import { postChatCompletion } from './openrouter-request';

interface ChatRequest {
  messages: OpenRouterMessage[];
  tools?: unknown[];
}

interface ChatResponse {
  content: string;
  completionTokens: number | null;
  promptTokens: number | null;
  toolCalls: ToolCall[];
}

type DeltaHandler = (_chunk: string) => Promise<void>;

export const runOpenRouterChat = async (env: EnvBindings, request: ChatRequest): Promise<ChatResponse> => {
  const response = await postChatCompletion(env, {
    messages: request.messages,
    stream: false,
    tools: request.tools,
  });

  if (!response.ok) {
    throw toAppError('OPENROUTER_REJECTED', 'openrouter request rejected', HTTP_BAD_REQUEST);
  }

  const payload = await parseChatPayload(response);
  const message = payload.choices?.at(0)?.message;
  if (message === undefined) {
    throw toAppError('OPENROUTER_EMPTY', 'empty model response', HTTP_INTERNAL_ERROR);
  }

  return {
    completionTokens: parseCompletionTokens(payload.usage),
    content: message.content ?? '',
    promptTokens: parsePromptTokens(payload.usage),
    toolCalls: mapToolCalls(message.tool_calls),
  };
};

export const runOpenRouterJson = async <T>(env: EnvBindings, messages: OpenRouterMessage[]): Promise<T> => {
  const response = await runOpenRouterChat(env, { messages });

  const raw = response.content.trim();
  const json = raw.startsWith('```') ? raw.replace(/^```(?:json)?\r?\n/, '').replace(/\r?\n```$/, '') : raw;

  try {
    return JSON.parse(json) as T;
  } catch {
    throw toAppError('OPENROUTER_JSON_INVALID', 'model did not return valid json', HTTP_BAD_REQUEST);
  }
};

export const runOpenRouterStreamText = async (
  env: EnvBindings,
  messages: OpenRouterMessage[],
  onDelta: DeltaHandler,
): Promise<string> => {
  const response = await postChatCompletion(env, {
    messages,
    stream: true,
  });
  if (!response.ok || response.body === null) {
    throw toAppError('OPENROUTER_REJECTED', 'openrouter streaming failed', HTTP_BAD_REQUEST);
  }
  return await streamToText(response.body.getReader(), onDelta);
};

const parseArguments = (value: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return parsed;
  } catch {
    return {};
  }
};

const parsePromptTokens = (usage?: { prompt_tokens?: number }): number | null => {
  if (usage?.prompt_tokens === undefined || !Number.isFinite(usage.prompt_tokens)) {
    return null;
  }
  return usage.prompt_tokens;
};

const parseCompletionTokens = (usage?: { completion_tokens?: number }): number | null => {
  if (usage?.completion_tokens === undefined || !Number.isFinite(usage.completion_tokens)) {
    return null;
  }
  return usage.completion_tokens;
};

const parseChatPayload = async (
  response: Response,
): Promise<{
  choices?: Array<{ message?: { content?: string | null; tool_calls?: Array<{ function?: { arguments?: string; name?: string }; id?: string }> } }>;
  usage?: { completion_tokens?: number; prompt_tokens?: number };
}> => {
  return (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null; tool_calls?: Array<{ function?: { arguments?: string; name?: string }; id?: string }> } }>;
    usage?: { completion_tokens?: number; prompt_tokens?: number };
  };
};

const mapToolCalls = (
  calls: Array<{ function?: { arguments?: string; name?: string }; id?: string }> | undefined,
): ToolCall[] => {
  return (calls ?? [])
    .map((call) => {
      const args = call.function?.arguments;
      const name = call.function?.name;
      if (call.id === undefined || name === undefined || args === undefined) {
        return null;
      }
      return {
        arguments: parseArguments(args),
        id: call.id,
        name,
      };
    })
    .filter((item): item is ToolCall => item !== null);
};

const streamToText = async (reader: ReadableStreamDefaultReader<Uint8Array>, onDelta: DeltaHandler): Promise<string> => {
  const decoder = new TextDecoder();
  let buffer = '';
  let output = '';
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const next = await parseDeltaLine(line, onDelta);
      if (next !== null) {
        output += next;
      }
    }
  }
  return output;
};

const parseDeltaLine = async (line: string, onDelta: DeltaHandler): Promise<string | null> => {
  if (!line.startsWith('data: ')) {
    return null;
  }
  const raw = line.slice('data: '.length).trim();
  if (raw === '[DONE]') {
    return null;
  }

  try {
    const payload = JSON.parse(raw) as { choices?: Array<{ delta?: { content?: string } }> };
    const content = payload.choices?.at(0)?.delta?.content;
    if (content === undefined || content.length === 0) {
      return null;
    }
    await onDelta(content);
    return content;
  } catch {
    return null;
  }
};
