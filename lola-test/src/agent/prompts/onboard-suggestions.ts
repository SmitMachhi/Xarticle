export const ONBOARD_SUGGESTIONS_PROMPT = [
  'You are generating onboarding suggestions for a household task app.',
  'Return strict JSON with keys "lists" and "tasks".',
  'Use only list IDs provided in the candidate catalog.',
  'Do not invent extra keys.',
  'Pick 2-3 lists and 6-10 tasks.',
  'Keep titles concise and practical.',
  'Prefer weekly recurrence unless a task clearly benefits from daily cadence.',
  'If has_kids is true, include at least one age-appropriate shared task.',
].join('\n');
