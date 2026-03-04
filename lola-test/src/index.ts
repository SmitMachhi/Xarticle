import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { HTTP_NOT_FOUND } from './constants';
import { assertEnv } from './lib/env';
import { getErrorResponse } from './lib/http';
import { authRoutes } from './routes/auth';
import { feedRoutes } from './routes/feed';
import { gamificationRoutes } from './routes/gamification';
import { householdRoutes } from './routes/households';
import { listRoutes } from './routes/lists';
import { lolaRoutes } from './routes/lola';
import { onboardRoutes } from './routes/onboard';
import { scoreRoutes } from './routes/score';
import { subscriptionRoutes } from './routes/subscription';
import { taskActionRoutes } from './routes/task-actions';
import { taskRoutes } from './routes/tasks';
import { widgetRoutes } from './routes/widget';
import type { AppVariables, EnvBindings } from './types';

export const app = new Hono<{ Bindings: EnvBindings; Variables: AppVariables }>();

app.use('*', cors());

app.use('*', async (ctx, next) => {
  assertEnv(ctx.env);
  await next();
});

app.get('/health', (ctx) => {
  return ctx.json({ ok: true });
});

app.route('/auth', authRoutes);
app.route('/feed', feedRoutes);
app.route('/households', householdRoutes);
app.route('/lists', listRoutes);
app.route('/lola', lolaRoutes);
app.route('/onboard', onboardRoutes);
app.route('/score', scoreRoutes);
app.route('/subscription', subscriptionRoutes);
app.route('/tasks', taskRoutes);
app.route('/tasks', taskActionRoutes);
app.route('/widget', widgetRoutes);
app.route('/', gamificationRoutes);

app.notFound((ctx) => {
  return ctx.json({ error: 'NOT_FOUND', message: 'route not found' }, HTTP_NOT_FOUND);
});

app.onError((error, ctx) => {
  const response = getErrorResponse(error);
  return ctx.json(response.body, response.status);
});

export default app;
