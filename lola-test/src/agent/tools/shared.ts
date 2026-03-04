import { HTTP_BAD_REQUEST } from '../../constants';
import { toAppError } from '../../lib/http';
import { getServiceClient } from '../../lib/supabase';
import type { EnvBindings, UserRole } from '../../types';

export interface ToolContext {
  env: EnvBindings;
  householdId: string;
  role: UserRole;
  userId: string;
}

export interface ToolDefinition {
  description: string;
  execute: (_context: ToolContext, _args: Record<string, unknown>) => Promise<unknown>;
  schema: Record<string, unknown>;
}

export const requireAdminRole = (role: UserRole): void => {
  if (role !== 'admin') {
    throw toAppError('ADMIN_REQUIRED', 'admin tool', HTTP_BAD_REQUEST);
  }
};

export const getToolService = (context: ToolContext) => {
  return getServiceClient(context.env);
};
