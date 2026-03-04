import { COMPACTION_CHAR_THRESHOLD, MEMORY_MAX_CHARS, STORAGE_MEMORY_PATH, TWENTY } from '../constants';
import { runOpenRouterChat } from '../lib/openrouter';
import { getServiceClient, mustData } from '../lib/supabase';
import type { EnvBindings } from '../types';

const COMPACTION_PROMPT = [
  'Summarize conversation memory for a household assistant.',
  'Extract durable preferences, recurring patterns, explicit remember-requests, and key decisions.',
  'Keep concrete facts and omit transient chatter.',
  'Return structured markdown with sections:',
  '# Memory',
  '## Preferences',
  '## Recurring Patterns',
  '## Decisions',
  '## Explicit Reminders',
].join('\n');

export const compactMemoryIfNeeded = async (env: EnvBindings, userId: string): Promise<void> => {
  const service = getServiceClient(env);
  const historyQuery = await service
    .from('lola_messages')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  const history = mustData(historyQuery.data, historyQuery.error, 'LOLA_HISTORY_FETCH_FAILED');
  if (!shouldCompact(history)) {
    return;
  }

  const toCompact = selectCompactionSlice(history);
  const summary = await summarizeWithModel(env, toCompact);
  const memory = capMemory(summary);
  await service.storage.from(STORAGE_MEMORY_PATH).upload(`${userId}/memory.md`, new Blob([memory]), {
    contentType: 'text/markdown',
    upsert: true,
  });
};

const shouldCompact = (messages: Array<{ content: string }>): boolean => {
  return messages.reduce((sum, message) => sum + message.content.length, 0) > COMPACTION_CHAR_THRESHOLD;
};

const selectCompactionSlice = (history: Array<{ content: string; role: string }>): Array<{ content: string; role: string }> => {
  const overflowCount = Math.max(history.length - TWENTY, 1);
  return history.slice(0, overflowCount);
};

const summarizeWithModel = async (
  env: EnvBindings,
  messages: Array<{ content: string; role: string }>,
): Promise<string> => {
  const response = await runOpenRouterChat(env, {
    messages: [
      { content: COMPACTION_PROMPT, role: 'system' },
      { content: messages.map((message) => `${message.role}: ${message.content}`).join('\n'), role: 'user' },
    ],
  });
  return response.content;
};

const capMemory = (content: string): string => {
  const body = content.length <= MEMORY_MAX_CHARS ? content : content.slice(0, MEMORY_MAX_CHARS);
  return ['MEMORY.md', body].join('\n');
};
