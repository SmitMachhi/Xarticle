import { EIGHT, FIVE } from '../constants';
import { runOpenRouterChat, runOpenRouterStreamText } from '../lib/openrouter';
import type { EnvBindings, OpenRouterMessage } from '../types';
import type { RunPolicy, SpeechAct } from './contracts';
import { shouldUseRealizer } from './copy-policy';
import { FALLBACK_COPY } from './fallback-copy';

interface RealizeInput {
  draft: string;
  onDelta?: (_chunk: string) => Promise<void>;
  policy: RunPolicy;
  recentAssistantTexts: string[];
  speechAct: SpeechAct;
}

const SIMILARITY_THRESHOLD = 0.9;

export const realizeText = async (env: EnvBindings, input: RealizeInput): Promise<string> => {
  const fallback = applyPolicy(input.draft, input.policy);
  if (!shouldUseRealizer(env)) {
    return await streamFallbackIfNeeded(input.onDelta, fallback);
  }
  if (input.onDelta !== undefined) {
    return await realizeStreaming(env, input, fallback);
  }

  const base = await realizeOnce(env, input, fallback);
  const guarded = await rewriteIfTooSimilar(env, input, base);
  return guarded;
};

const realizeStreaming = async (env: EnvBindings, input: RealizeInput, fallback: string): Promise<string> => {
  const messages = buildRealizerMessages(input.speechAct, input.policy, input.draft, input.recentAssistantTexts);
  return await runOpenRouterStreamText(env, messages, input.onDelta as (_chunk: string) => Promise<void>).catch(async () => {
    await (input.onDelta as (_chunk: string) => Promise<void>)(fallback);
    return fallback;
  });
};

const realizeOnce = async (env: EnvBindings, input: RealizeInput, fallback: string): Promise<string> => {
  const messages = buildRealizerMessages(input.speechAct, input.policy, input.draft, input.recentAssistantTexts);
  return await runOpenRouterChat(env, { messages, useCase: 'realizer' })
    .then((response) => applyPolicy(response.content, input.policy))
    .catch(() => fallback);
};

const rewriteIfTooSimilar = async (env: EnvBindings, input: RealizeInput, text: string): Promise<string> => {
  if (!isTooSimilar(text, input.recentAssistantTexts)) {
    return text;
  }

  const messages: OpenRouterMessage[] = [
    {
      content: [
        'Rewrite the text with fresh phrasing while preserving meaning.',
        'Do not remove factual details or requests.',
        `Banned phrases: ${input.policy.banned_phrases.join(', ')}`,
      ].join('\n'),
      role: 'system',
    },
    {
      content: JSON.stringify({ recent: input.recentAssistantTexts.slice(-FIVE), text }),
      role: 'user',
    },
  ];

  return await runOpenRouterChat(env, { messages, useCase: 'realizer' })
    .then((response) => applyPolicy(response.content, input.policy))
    .catch(() => text);
};

const buildRealizerMessages = (
  speechAct: SpeechAct,
  policy: RunPolicy,
  draft: string,
  recentAssistantTexts: string[],
): OpenRouterMessage[] => {
  return [
    {
      content: [
        'You realize assistant copy from structured context.',
        'Keep language natural and specific.',
        'Never mention internal runtime, context limits, compaction, or retries.',
        `Max characters: ${policy.max_chars}`,
        `Banned phrases: ${policy.banned_phrases.join(', ')}`,
        `Tone constraints: ${policy.tone_constraints.join(', ')}`,
      ].join('\n'),
      role: 'system',
    },
    {
      content: JSON.stringify({ draft, recent_assistant_texts: recentAssistantTexts.slice(-EIGHT), speech_act: speechAct }),
      role: 'user',
    },
  ];
};

const applyPolicy = (text: string, policy: RunPolicy): string => {
  const trimmed = text.trim().length === 0 ? FALLBACK_COPY.LOOP_RECOVERY : text.trim();
  const bannedRemoved = policy.banned_phrases.reduce(
    (value, phrase) => value.replace(new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'gi'), '').replace(/\s{2,}/g, ' ').trim(),
    trimmed,
  );
  if (bannedRemoved.length <= policy.max_chars) {
    return bannedRemoved;
  }
  return bannedRemoved.slice(0, policy.max_chars).trim();
};

const streamFallbackIfNeeded = async (onDelta: RealizeInput['onDelta'], text: string): Promise<string> => {
  if (onDelta !== undefined) {
    await onDelta(text);
  }
  return text;
};

const isTooSimilar = (candidate: string, history: string[]): boolean => {
  const normalizedCandidate = normalize(candidate);
  if (normalizedCandidate.length === 0) {
    return false;
  }
  return history.some((item) => jaccardSimilarity(normalizedCandidate, normalize(item)) >= SIMILARITY_THRESHOLD);
};

const normalize = (value: string): string[] => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
};

const jaccardSimilarity = (left: string[], right: string[]): number => {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter((token) => rightSet.has(token)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  if (union === 0) {
    return 0;
  }
  return intersection / union;
};

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
