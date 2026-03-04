import { realizeEdgeCopy } from '../_shared/copy.ts'
import { callOpenRouterJson, createServiceClient, localDate, localWeekdayAndHour, pushToHousehold } from '../_shared/runtime.ts'

const TARGET_HOUR = 20
const TARGET_WEEKDAY = 0
const LOOKBACK_DAYS = 7
const MILLISECONDS_PER_DAY = 86_400_000

interface WeeklyRecapPayload {
  nudge: string
  push_body: string
  push_title: string
  summary: string
}

Deno.serve(async () => {
  const service = createServiceClient()
  const households = await service.from('households').select('id, name, timezone, home_score, family_streak').eq('is_active', true)
  if (households.error !== null || households.data === null) {
    return new Response(JSON.stringify({ ok: false }), { status: 500 })
  }

  const now = new Date()
  for (const household of households.data) {
    const localClock = localWeekdayAndHour(now, household.timezone)
    if (localClock.weekday !== TARGET_WEEKDAY || localClock.hour !== TARGET_HOUR) {
      continue
    }

    const weekEnding = localDate(now, household.timezone)
    const already = await service
      .from('weekly_recaps')
      .select('id')
      .eq('household_id', household.id)
      .eq('week_ending', weekEnding)
      .limit(1)

    if (already.error === null && already.data !== null && already.data.length > 0) {
      continue
    }

    const recap = await buildRecap(service, household.id, household.name, household.home_score, household.family_streak, weekEnding)
    await service.from('weekly_recaps').insert({
      household_id: household.id,
      nudge: recap.nudge,
      push_body: recap.push_body,
      push_title: recap.push_title,
      summary: recap.summary,
      week_ending: weekEnding,
    })
    await service.from('feed_events').insert({
      event_type: 'weekly_recap',
      household_id: household.id,
      payload: { nudge: recap.nudge, summary: recap.summary },
    })
    await pushToHousehold(service, household.id, {
      body: recap.push_body,
      title: recap.push_title,
    })
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})

const buildRecap = async (
  service: ReturnType<typeof createServiceClient>,
  householdId: string,
  householdName: string,
  homeScore: number,
  familyStreak: number,
  weekEnding: string,
): Promise<WeeklyRecapPayload> => {
  const since = new Date(Date.now() - LOOKBACK_DAYS * MILLISECONDS_PER_DAY).toISOString()
  const [users, completions, tasks] = await Promise.all([
    service.from('users').select('id, display_name').eq('household_id', householdId),
    service.from('completions').select('completed_by, task_id').eq('household_id', householdId).gte('completed_at', since),
    service.from('tasks').select('id, title, streak_count').eq('household_id', householdId).eq('is_archived', false),
  ])

  if (users.error !== null || completions.error !== null || tasks.error !== null) {
    return await fallbackRecap(householdName, familyStreak, homeScore, weekEnding)
  }

  const members = users.data ?? []
  const completionRows = completions.data ?? []
  const taskRows = tasks.data ?? []
  const byMember = new Map<string, number>()
  const byTask = new Map<string, number>()
  for (const row of completionRows) {
    byMember.set(row.completed_by, (byMember.get(row.completed_by) ?? 0) + 1)
    byTask.set(row.task_id, (byTask.get(row.task_id) ?? 0) + 1)
  }

  const taskTitles = new Map(taskRows.map((task) => [task.id, task.title]))
  const topTasks = [...byTask.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([taskId, count]) => ({ count, title: taskTitles.get(taskId) ?? 'household task' }))
  const memberCounts = members.map((member) => ({ count: byMember.get(member.id) ?? 0, name: member.display_name }))
  const longestStreak = taskRows.reduce((max, task) => (task.streak_count > max ? task.streak_count : max), 0)

  try {
    const result = await callOpenRouterJson<WeeklyRecapPayload>([
      {
        content: [
          'You are Lola.',
          'Write a warm weekly household recap.',
          'Never pit members against each other.',
          'If teens contributed, mention that warmly.',
          'Never mention what was missed.',
          'Return only JSON with summary, nudge, push_title, push_body.',
        ].join('\n'),
        role: 'system',
      },
      {
        content: JSON.stringify({
          family_streak: familyStreak,
          home_score: homeScore,
          household_name: householdName,
          longest_individual_streak: longestStreak,
          member_completion_counts: memberCounts,
          top_tasks_completed: topTasks,
          week_ending: weekEnding,
        }),
        role: 'user',
      },
    ])
    if (isValidRecap(result)) {
      return result
    }
  } catch {
    return await fallbackRecap(householdName, familyStreak, homeScore, weekEnding)
  }

  return await fallbackRecap(householdName, familyStreak, homeScore, weekEnding)
}

const fallbackRecap = async (
  householdName: string,
  familyStreak: number,
  homeScore: number,
  weekEnding: string,
): Promise<WeeklyRecapPayload> => {
  const copy = await realizeEdgeCopy(
    {
      audience: 'household',
      constraints: ['Celebrate effort and suggest one next action.'],
      facts: { family_streak: familyStreak, home_score: homeScore, household_name: householdName, week_ending: weekEnding },
      intent: 'weekly_recap',
      tone: 'balanced',
    },
    {
      body: `Big week for ${householdName}. Team effort keeps things moving.`,
      push_body: 'Lola wrapped your week. Tap to see the highlights.',
      push_title: `${householdName} weekly recap`,
    },
  )

  return {
    nudge: copy.body,
    push_body: copy.push_body,
    push_title: copy.push_title,
    summary: copy.body,
  }
}

const isValidRecap = (value: unknown): value is WeeklyRecapPayload => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  if (!('summary' in value) || !('nudge' in value) || !('push_title' in value) || !('push_body' in value)) {
    return false
  }
  return (
    typeof value.summary === 'string' &&
    typeof value.nudge === 'string' &&
    typeof value.push_title === 'string' &&
    typeof value.push_body === 'string'
  )
}
