import { getServiceClient } from '../../lib/supabase';
import { catchupTools } from './catchup';
import { feedTools } from './feed';
import { gamificationTools } from './gamification';
import { householdTools } from './household';
import { listTools } from './lists';
import type { ToolContext, ToolDefinition } from './shared';
import { taskTools } from './tasks';

const mergedTools: Record<string, ToolDefinition> = {
  ...catchupTools,
  ...feedTools,
  ...gamificationTools,
  ...householdTools,
  ...listTools,
  ...taskTools,
};

export const executeTool = async (
  context: ToolContext,
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> => {
  const tool = mergedTools[toolName];
  if (tool === undefined) {
    return { error: `unknown tool: ${toolName}` };
  }
  try {
    return await tool.execute(context, args);
  } catch (error) {
    if (!isAdminError(error)) {
      return { error: 'tool_failed' };
    }
    const message = await buildAdminDeniedMessage(context);
    return { error: message };
  }
};

export const getToolSchemas = (): unknown[] => {
  return Object.entries(mergedTools).map(([name, tool]) => ({
    function: {
      description: tool.description,
      name,
      parameters: tool.schema,
    },
    type: 'function',
  }));
};

const isAdminError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  if (!('code' in error)) {
    return false;
  }
  return error.code === 'ADMIN_REQUIRED';
};

const buildAdminDeniedMessage = async (context: ToolContext): Promise<string> => {
  const service = getServiceClient(context.env);
  const [household, members] = await Promise.all([
    service.from('households').select('lola_personality').eq('id', context.householdId).maybeSingle(),
    service.from('users').select('display_name, role').eq('household_id', context.householdId),
  ]);
  const adminName = members.data?.find((member) => member.role === 'admin')?.display_name ?? 'an admin';
  const personality = household.data?.lola_personality ?? 'balanced';
  if (personality === 'sassy') {
    return `cute. that's an admin move — ask ${adminName} to handle it 🧹`;
  }
  if (personality === 'calm') {
    return `that action requires admin access. ${adminName} can help with that`;
  }
  return `that one's for the admins — ${adminName} can take care of it`;
};
