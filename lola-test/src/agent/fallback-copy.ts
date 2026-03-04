export const FALLBACK_COPY = {
  EVENT_CHAT: 'I made a household update.',
  EVENT_PUSH_BODY: 'There is a new household update waiting.',
  EVENT_PUSH_TITLE: 'Lola update',
  LOOP_RECOVERY: "I couldn't finish that request just now. Please try again.",
} as const;

export const HARDCODED_COPY_ALLOWLIST = new Set<string>(Object.values(FALLBACK_COPY));
