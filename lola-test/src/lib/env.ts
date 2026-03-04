import type { EnvBindings } from '../types';

export const REQUIRED_ENV: Array<keyof EnvBindings> = [
  'AGENT_COPY_ENFORCEMENT_ENABLED',
  'AGENT_EVENT_COPY_ENABLED',
  'AGENT_REALIZER_ENABLED',
  'APNS_KEY_ID',
  'APNS_PRIVATE_KEY',
  'APNS_TEAM_ID',
  'APP_BUNDLE_ID',
  'APP_ENV',
  'INVITE_CODE_SALT',
  'OPENROUTER_API_KEY',
  'OPENROUTER_CHAT_MODEL',
  'OPENROUTER_EDGE_JSON_MODEL',
  'OPENROUTER_JSON_MODEL',
  'OPENROUTER_MODEL',
  'OPENROUTER_REASONING_EFFORT_JSON',
  'REVENUECAT_WEBHOOK_SECRET',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_URL',
];

export const OPTIONAL_ENV = new Set<keyof EnvBindings>([
  'AGENT_COPY_ENFORCEMENT_ENABLED',
  'AGENT_EVENT_COPY_ENABLED',
  'AGENT_REALIZER_ENABLED',
  'APP_BUNDLE_ID',
  'OPENROUTER_CHAT_MODEL',
  'OPENROUTER_EDGE_JSON_MODEL',
  'OPENROUTER_JSON_MODEL',
  'APP_ENV',
  'OPENROUTER_MODEL',
  'OPENROUTER_REASONING_EFFORT_JSON',
]);

export const getMissingEnv = (env: EnvBindings): string[] => {
  return REQUIRED_ENV.filter((key) => {
    if (OPTIONAL_ENV.has(key)) {
      return false;
    }
    const value = env[key]?.trim();
    return value.length === 0 || value === 'REPLACE_ME';
  });
};

export const assertEnv = (env: EnvBindings): void => {
  const missing = getMissingEnv(env);
  if (missing.length > 0) {
    throw new Error(`missing env: ${missing.join(',')}`);
  }
};
