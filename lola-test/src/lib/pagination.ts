import { z } from 'zod';

import { FEED_DEFAULT_LIMIT, MESSAGES_DEFAULT_LIMIT, ONE, THIRTY } from '../constants';

const paginationSchema = z.object({
  before: z.string().optional(),
  limit: z.coerce.number().int().min(ONE).max(THIRTY).optional(),
});

export interface Pagination {
  before: string | null;
  limit: number;
}

export const parsePagination = (query: Record<string, string | undefined>, defaultLimit = FEED_DEFAULT_LIMIT): Pagination => {
  const parsed = paginationSchema.parse(query);
  return {
    before: parsed.before ?? null,
    limit: parsed.limit ?? defaultLimit,
  };
};

export const parseMessagePagination = (query: Record<string, string | undefined>): Pagination => {
  return parsePagination(query, MESSAGES_DEFAULT_LIMIT);
};
