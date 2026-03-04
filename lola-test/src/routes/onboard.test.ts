import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getErrorResponse } from '../lib/http';
import type { AppVariables, EnvBindings } from '../types';
import { onboardRoutes } from './onboard';

const state = vi.hoisted(() => ({
  applyMock: vi.fn(),
  jobResult: { data: null as unknown, error: null as { message: string } | null },
}));

vi.mock('../middleware/auth', () => ({
  authMiddleware: async (
    ctx: { set: (_key: 'auth', _value: AppVariables['auth']) => void },
    next: () => Promise<void>,
  ) => {
    ctx.set('auth', {
      accessToken: 'token-1',
      householdId: 'house-1',
      role: 'admin',
      userId: 'user-1',
    });
    await next();
  },
}));

vi.mock('../lib/supabase', () => ({
  getUserClient: () => ({
    from: () => ({
      select: () => {
        const builder = {
          eq: () => builder,
          maybeSingle: async () => state.jobResult,
        };
        return builder;
      },
    }),
  }),
  mustData: (data: unknown, error: { message: string } | null, code: string) => {
    if (error !== null || data === null) {
      throw Object.assign(new Error(code), { code, status: 404 });
    }
    return data;
  },
}));

vi.mock('../lib/onboard-jobs', () => ({
  applyOnboardSuggestions: (...args: unknown[]) => state.applyMock(...args),
}));

vi.mock('../lib/onboard-job-processor', () => ({
  processOnboardSuggestionJob: async () => undefined,
}));

const buildApp = () => {
  const app = new Hono<{ Bindings: EnvBindings; Variables: AppVariables }>();
  app.route('/onboard', onboardRoutes);
  app.onError((error, ctx) => {
    const parsed = getErrorResponse(error);
    return ctx.json(parsed.body, parsed.status);
  });
  return app;
};

const authHeaders = {
  authorization: 'Bearer token-1',
};

const env = {} as EnvBindings;

describe('onboard suggestion routes', () => {
  beforeEach(() => {
    state.applyMock.mockReset();
    state.jobResult = { data: null, error: null };
  });

  it('returns pending job without suggestions', async () => {
    state.jobResult = {
      data: { error_code: null, id: 'job-1', status: 'processing', suggestions: null },
      error: null,
    };

    const response = await buildApp().request('/onboard/suggestions/job-1', { headers: authHeaders }, env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      job_id: 'job-1',
      status: 'processing',
      suggestions: null,
    });
  });

  it('returns ready job with validated suggestions', async () => {
    state.jobResult = {
      data: {
        error_code: null,
        id: 'job-2',
        status: 'ready',
        suggestions: {
          lists: [{ id: 'home-core', list_type: 'household', name: 'Home Core' }],
          tasks: [{ id: 'task-1', list_id: 'home-core', recurrence_type: 'weekly', title: 'Reset shared surfaces' }],
        },
      },
      error: null,
    };

    const response = await buildApp().request('/onboard/suggestions/job-2', { headers: authHeaders }, env);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string; suggestions: { lists: unknown[]; tasks: unknown[] } };
    expect(body.status).toBe('ready');
    expect(body.suggestions.lists).toHaveLength(1);
    expect(body.suggestions.tasks).toHaveLength(1);
  });

  it('returns failed payload when job failed', async () => {
    state.jobResult = {
      data: {
        error_code: 'ONBOARD_SUGGESTION_FAILED',
        id: 'job-3',
        status: 'failed',
        suggestions: null,
      },
      error: null,
    };

    const response = await buildApp().request('/onboard/suggestions/job-3', { headers: authHeaders }, env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      error: 'ONBOARD_SUGGESTION_FAILED',
      job_id: 'job-3',
      status: 'failed',
      suggestions: null,
    });
  });

  it('requires idempotency key for apply', async () => {
    await expect(
      buildApp().request(
        '/onboard/suggestions/job-4/apply',
        {
          body: JSON.stringify({ selected_list_ids: ['home-core'], selected_task_ids: ['task-1'] }),
          headers: { ...authHeaders, 'content-type': 'application/json' },
          method: 'POST',
        },
        env,
      ),
    ).rejects.toThrow(/x-idempotency-key header required/);
    expect(state.applyMock).not.toHaveBeenCalled();
  });

  it('applies selections idempotently when header is set', async () => {
    state.applyMock.mockResolvedValueOnce({
      created_list_map: [{ list_id: 'list-1', suggestion_list_id: 'home-core' }],
      lists_created: 1,
      tasks_created: 2,
    });

    const body = { selected_list_ids: ['home-core'], selected_task_ids: ['task-1', 'task-2'] };
    const response = await buildApp().request(
      '/onboard/suggestions/job-5/apply',
      {
        body: JSON.stringify(body),
        headers: {
          ...authHeaders,
          'content-type': 'application/json',
          'x-idempotency-key': 'idem-1',
        },
        method: 'POST',
      },
      env,
    );

    expect(response.status).toBe(200);
    expect(state.applyMock).toHaveBeenCalledWith(env, 'token-1', 'user-1', 'job-5', body, 'idem-1');
    await expect(response.json()).resolves.toEqual({
      created_list_map: [{ list_id: 'list-1', suggestion_list_id: 'home-core' }],
      lists_created: 1,
      tasks_created: 2,
    });
  });
});
