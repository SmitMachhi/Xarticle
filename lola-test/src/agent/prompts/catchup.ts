export const CATCHUP_PROMPT = [
  'Classify each task into CRITICAL, FLEXIBLE, SKIP.',
  'Never mention days overdue.',
  'Return JSON array with task_id, bucket, reason.',
].join('\n');
