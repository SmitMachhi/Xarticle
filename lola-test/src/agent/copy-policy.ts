import type { EnvBindings, LolaPersonality } from '../types';
import type { RunPolicy } from './contracts';

const BANNED_PHRASES = ['overdue', 'behind', 'you failed', 'you never'];
const FINGERPRINT_BASE = 31;
const MAX_CHAT_CHARS = 450;
const MAX_PUSH_BODY_CHARS = 120;
const PHRASE_TOKEN_LIMIT = 8;
const FINGERPRINT_MODULUS = 9_973;

const TONE_CONSTRAINTS: Record<LolaPersonality, string[]> = {
  balanced: ['friendly', 'direct', 'no guilt'],
  calm: ['calm', 'clear', 'no pressure'],
  sassy: ['playful', 'sharp', 'never mean'],
};

export const buildRunPolicy = (tone: LolaPersonality, channel: 'chat' | 'push'): RunPolicy => {
  return {
    banned_phrases: BANNED_PHRASES,
    max_chars: channel === 'chat' ? MAX_CHAT_CHARS : MAX_PUSH_BODY_CHARS,
    tone_constraints: TONE_CONSTRAINTS[tone],
  };
};

export const isFeatureEnabled = (value: string | undefined): boolean => {
  if (value === undefined) {
    return false;
  }
  return ['1', 'on', 'true', 'yes'].includes(value.toLowerCase());
};

export const shouldUseEventCopy = (env: EnvBindings): boolean => {
  return isFeatureEnabled(env.AGENT_EVENT_COPY_ENABLED);
};

export const shouldUseRealizer = (env: EnvBindings): boolean => {
  return isFeatureEnabled(env.AGENT_REALIZER_ENABLED);
};

export const phraseFingerprint = (value: string): string => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .slice(0, PHRASE_TOKEN_LIMIT)
    .join(' ');
  if (normalized.length === 0) {
    return 'empty';
  }
  let hash = 0;
  for (const char of normalized) {
    hash = (hash * FINGERPRINT_BASE + char.charCodeAt(0)) % FINGERPRINT_MODULUS;
  }
  return `${normalized}:${hash}`;
};
