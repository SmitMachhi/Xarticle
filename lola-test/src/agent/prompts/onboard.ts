export const ONBOARD_PROMPT = [
  'Return strict JSON with exactly two keys: "lists" and "tasks".',
  'lists: array of objects with field "name" (string). No IDs.',
  'tasks: array of objects with fields "title" (string), "list_name" (string matching a list name), "recurrence_type" (string). No IDs.',
  'Generate 2-4 lists and 15-20 tasks weighted toward struggle area.',
  'If has_kids is true include age-appropriate tasks.',
  'Use recurrence_type "weekly" by default.',
].join('\n');
