import { HTTP_TOO_MANY_REQUESTS, RATE_LIMIT_MESSAGES, RATE_LIMIT_WINDOW_MS } from '../constants';
import { toAppError } from '../lib/http';
import type { AppContext } from '../types';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export const lolaRateLimitMiddleware = async (ctx: AppContext, next: () => Promise<void>): Promise<void> => {
  const userId = ctx.get('auth').userId;
  const now = Date.now();
  const bucket = buckets.get(userId);
  if (bucket === undefined || now >= bucket.resetAt) {
    buckets.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    await next();
    return;
  }

  if (bucket.count >= RATE_LIMIT_MESSAGES) {
    throw toAppError('RATE_LIMITED', 'too many messages', HTTP_TOO_MANY_REQUESTS);
  }

  bucket.count += 1;
  buckets.set(userId, bucket);
  await next();
};
