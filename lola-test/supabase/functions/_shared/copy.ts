import { callOpenRouterJson } from './runtime.ts'

export interface EdgeSpeechAct {
  audience: 'admin' | 'household' | 'user'
  constraints?: string[]
  facts: Record<string, unknown>
  intent: string
  tone: 'balanced' | 'calm' | 'sassy'
}

export interface EdgeRealizedCopy {
  body: string
  push_body: string
  push_title: string
}

interface FallbackCopy {
  body: string
  push_body?: string
  push_title?: string
}

const BANNED_PHRASES = ['overdue', 'behind']
const MAX_BODY_CHARS = 320
const MAX_PUSH_BODY_CHARS = 120
const DEFAULT_PUSH_TITLE = 'Lola update'

export const realizeEdgeCopy = async (speechAct: EdgeSpeechAct, fallback: FallbackCopy): Promise<EdgeRealizedCopy> => {
  const safeFallback = withDefaults(fallback)
  try {
    const realized = await callOpenRouterJson<unknown>([
      {
        content: [
          'You realize household assistant copy from structured speech acts.',
          'Keep it concrete, short, and kind.',
          'Never mention internal runtime details.',
          `Banned phrases: ${BANNED_PHRASES.join(', ')}`,
          'Return only JSON: body, push_title, push_body',
        ].join('\n'),
        role: 'system',
      },
      {
        content: JSON.stringify({ fallback: safeFallback, speech_act: speechAct }),
        role: 'user',
      },
    ])

    if (!isCopy(realized)) {
      return safeFallback
    }

    return {
      body: sanitize(realized.body, MAX_BODY_CHARS),
      push_body: sanitize(realized.push_body, MAX_PUSH_BODY_CHARS),
      push_title: sanitize(realized.push_title, 60),
    }
  } catch {
    return safeFallback
  }
}

const withDefaults = (fallback: FallbackCopy): EdgeRealizedCopy => {
  const pushBody = fallback.push_body ?? fallback.body
  return {
    body: sanitize(fallback.body, MAX_BODY_CHARS),
    push_body: sanitize(pushBody, MAX_PUSH_BODY_CHARS),
    push_title: sanitize(fallback.push_title ?? DEFAULT_PUSH_TITLE, 60),
  }
}

const sanitize = (value: string, maxChars: number): string => {
  const next = BANNED_PHRASES.reduce(
    (text, phrase) => text.replace(new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'gi'), '').replace(/\s{2,}/g, ' ').trim(),
    value.trim(),
  )
  if (next.length <= maxChars) {
    return next
  }
  return next.slice(0, maxChars).trim()
}

const isCopy = (value: unknown): value is EdgeRealizedCopy => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const payload = value as Record<string, unknown>
  return typeof payload.body === 'string' && typeof payload.push_body === 'string' && typeof payload.push_title === 'string'
}

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
