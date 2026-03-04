import { dispatchDomainEvent } from '../../agent/event-dispatch';
import { getToolService } from './shared';

export const notifyTaskAssigned = async (
  env: Parameters<typeof dispatchDomainEvent>[0]['env'],
  service: ReturnType<typeof getToolService>,
  householdId: string,
  userId: string,
  title: string,
): Promise<void> => {
  await dispatchDomainEvent({
    env,
    event: {
      audience_user_ids: [userId],
      facts: { task_title: title },
      household_id: householdId,
      type: 'task_assigned',
    },
    service,
  });
};
