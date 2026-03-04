import { generateOnboardSuggestions } from '../agent/onboard-suggestions';
import type { EnvBindings } from '../types';
import { getServiceClient } from './supabase';

export interface OnboardJobInput {
  has_kids: boolean;
  home_type: string;
  household_id: string;
  num_people: number;
  struggle_area: string;
}

export const processOnboardSuggestionJob = async (
  env: EnvBindings,
  jobId: string,
  input: OnboardJobInput,
  userId: string,
): Promise<void> => {
  const service = getServiceClient(env);
  await service
    .from('onboarding_suggestion_jobs')
    .update({ attempt_count: 1, started_at: new Date().toISOString(), status: 'processing' })
    .eq('id', jobId)
    .eq('requested_by', userId);

  try {
    const suggestions = await generateOnboardSuggestions(env, input);
    await service
      .from('onboarding_suggestion_jobs')
      .update({
        error_code: null,
        error_message: null,
        finished_at: new Date().toISOString(),
        status: 'ready',
        suggestions,
      })
      .eq('id', jobId)
      .eq('requested_by', userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'suggestion generation failed';
    await service
      .from('onboarding_suggestion_jobs')
      .update({
        error_code: 'ONBOARD_SUGGESTION_FAILED',
        error_message: message,
        finished_at: new Date().toISOString(),
        status: 'failed',
      })
      .eq('id', jobId)
      .eq('requested_by', userId);
  }
};
