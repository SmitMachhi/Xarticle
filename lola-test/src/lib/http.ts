import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { z } from 'zod';

import { HTTP_BAD_REQUEST, HTTP_INTERNAL_ERROR } from '../constants';
import type { AppContext, AppError } from '../types';

export const parseBody = async <T>(ctx: AppContext, schema: z.ZodSchema<T>): Promise<T> => {
  const body = await ctx.req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw toAppError('INVALID_BODY', 'invalid request body', HTTP_BAD_REQUEST);
  }
  return parsed.data;
};

export const parseQuery = <T>(query: Record<string, unknown>, schema: z.ZodSchema<T>): T => {
  const parsed = schema.safeParse(query);
  if (!parsed.success) {
    throw toAppError('INVALID_QUERY', 'invalid query params', HTTP_BAD_REQUEST);
  }
  return parsed.data;
};

export const toAppError = (code: string, message: string, status: ContentfulStatusCode): AppError => {
  return { code, message, status };
};

export const getErrorResponse = (error: unknown): { body: { error: string; message: string }; status: ContentfulStatusCode } => {
  if (isAppError(error)) {
    return {
      body: { error: error.code, message: error.message },
      status: error.status,
    };
  }
  return {
    body: { error: 'INTERNAL_ERROR', message: 'something broke' },
    status: HTTP_INTERNAL_ERROR,
  };
};

const isAppError = (error: unknown): error is AppError => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  return 'code' in error && 'message' in error && 'status' in error;
};
