import { createServiceClient } from '../_shared/runtime.ts'

const BATCH_SIZE = 50
const MIN_SCORE = 10
const SCORE_WINDOW_DAYS = 7
const COVERAGE_WINDOW_DAYS = 14
const STREAK_CAP = 14
const SCORE_WEIGHT_COMPLETION = 0.4
const SCORE_WEIGHT_STREAK = 0.35
const SCORE_WEIGHT_COVERAGE = 0.25
const SCORE_LABEL_TRACK = 40
const SCORE_LABEL_GREAT = 75
const SCORE_LABEL_GOLD = 90
const MILLISECONDS_PER_DAY = 86_400_000

interface Metrics {
  completedInScoreWindow: number
  coveredListCount: number
  dueInScoreWindow: number
  householdListCount: number
  streakAverage: number
}

Deno.serve(async () => {
  const service = createServiceClient()
  const households = await service.from('households').select('id, home_score, score_above_90_since').eq('is_active', true)
  if (households.error !== null || households.data === null) {
    return new Response(JSON.stringify({ ok: false }), { status: 500 })
  }

  const now = Date.now()
  for (let index = 0; index < households.data.length; index += BATCH_SIZE) {
    const chunk = households.data.slice(index, index + BATCH_SIZE)
    await Promise.all(
      chunk.map((household) => refreshHouseholdScore(service, household.id, household.home_score, household.score_above_90_since, now)),
    )
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})

const refreshHouseholdScore = async (
  service: ReturnType<typeof createServiceClient>,
  householdId: string,
  previousScore: number,
  previousAboveNinetySince: string | null,
  nowMs: number,
): Promise<void> => {
  const [lists, tasks, completions] = await Promise.all([
    service.from('lists').select('id, list_type').eq('household_id', householdId).eq('is_archived', false),
    service.from('tasks').select('list_id, next_due, streak_count').eq('household_id', householdId).eq('is_archived', false),
    service.from('completions').select('list_id, completed_at').eq('household_id', householdId),
  ])

  if (lists.error !== null || tasks.error !== null || completions.error !== null) {
    return
  }

  const metrics = computeMetrics(lists.data ?? [], tasks.data ?? [], completions.data ?? [], nowMs)
  const score = calculateScore(metrics)
  const scoreAboveNinetySince = nextScoreAboveNinetySince(previousAboveNinetySince, score.score, nowMs)
  await service
    .from('households')
    .update({ home_score: score.score, score_above_90_since: scoreAboveNinetySince })
    .eq('id', householdId)

  const threshold = crossedThreshold(previousScore, score.score)
  if (threshold === null || !(await shouldEmitMilestone(service, householdId, threshold, nowMs))) {
    return
  }

  await service.from('feed_events').insert({
    event_type: 'home_score_milestone',
    household_id: householdId,
    payload: { label: score.label, score: score.score },
  })
}

const computeMetrics = (
  lists: Array<{ id: string; list_type: string }>,
  tasks: Array<{ list_id: string; next_due: string | null; streak_count: number }>,
  completions: Array<{ completed_at: string; list_id: string }>,
  nowMs: number,
): Metrics => {
  const today = isoDate(nowMs)
  const scoreSinceDate = isoDate(nowMs - (SCORE_WINDOW_DAYS - 1) * MILLISECONDS_PER_DAY)
  const coverageSinceIso = new Date(nowMs - (COVERAGE_WINDOW_DAYS - 1) * MILLISECONDS_PER_DAY)
  coverageSinceIso.setUTCHours(0, 0, 0, 0)
  const scoreSinceIso = new Date(nowMs - (SCORE_WINDOW_DAYS - 1) * MILLISECONDS_PER_DAY)
  scoreSinceIso.setUTCHours(0, 0, 0, 0)

  const householdLists = new Set(lists.filter((list) => list.list_type === 'household').map((list) => list.id))
  const householdTasks = tasks.filter((task) => householdLists.has(task.list_id))
  const householdCompletions = completions.filter((completion) => householdLists.has(completion.list_id))
  const dueInScoreWindow = householdTasks.filter((task) => {
    if (task.next_due === null) {
      return false
    }
    return task.next_due >= scoreSinceDate && task.next_due < today
  }).length
  const completedInScoreWindow = householdCompletions.filter((completion) => completion.completed_at >= scoreSinceIso.toISOString()).length
  const coverageRows = householdCompletions.filter((completion) => completion.completed_at >= coverageSinceIso.toISOString())
  const streakAverage = householdTasks.length === 0
    ? 0
    : householdTasks.reduce((sum, task) => sum + Math.min(task.streak_count, STREAK_CAP), 0) / householdTasks.length

  return {
    completedInScoreWindow,
    coveredListCount: new Set(coverageRows.map((row) => row.list_id)).size,
    dueInScoreWindow,
    householdListCount: householdLists.size,
    streakAverage,
  }
}

const calculateScore = (metrics: Metrics): { label: string; score: number } => {
  const completionRate = ratio(metrics.completedInScoreWindow, metrics.dueInScoreWindow)
  const streakHealth = Math.min(metrics.streakAverage / STREAK_CAP, 1)
  const coverage = ratio(metrics.coveredListCount, metrics.householdListCount)
  const weighted =
    completionRate * SCORE_WEIGHT_COMPLETION +
    streakHealth * SCORE_WEIGHT_STREAK +
    coverage * SCORE_WEIGHT_COVERAGE
  const score = Math.max(MIN_SCORE, Math.round(weighted * 100))
  return { label: scoreLabel(score), score }
}

const crossedThreshold = (previous: number, next: number): number | null => {
  if (previous < SCORE_LABEL_GOLD && next >= SCORE_LABEL_GOLD) {
    return SCORE_LABEL_GOLD
  }
  if (previous < SCORE_LABEL_GREAT && next >= SCORE_LABEL_GREAT) {
    return SCORE_LABEL_GREAT
  }
  return null
}

const shouldEmitMilestone = async (
  service: ReturnType<typeof createServiceClient>,
  householdId: string,
  threshold: number,
  nowMs: number,
): Promise<boolean> => {
  const since = new Date(nowMs - SCORE_WINDOW_DAYS * MILLISECONDS_PER_DAY).toISOString()
  const recent = await service
    .from('feed_events')
    .select('payload')
    .eq('household_id', householdId)
    .eq('event_type', 'home_score_milestone')
    .gte('created_at', since)

  if (recent.error !== null || recent.data === null || recent.data.length === 0) {
    return true
  }

  return !recent.data.some((event) => payloadScore(event.payload) >= threshold)
}

const payloadScore = (value: unknown): number => {
  if (typeof value !== 'object' || value === null || !('score' in value)) {
    return 0
  }
  const raw = value.score
  return typeof raw === 'number' ? raw : 0
}

const ratio = (top: number, bottom: number): number => {
  if (top <= 0 || bottom <= 0) {
    return 0
  }
  return Math.min(top / bottom, 1)
}

const scoreLabel = (score: number): string => {
  if (score < SCORE_LABEL_TRACK) {
    return "let's get back on track"
  }
  if (score < SCORE_LABEL_GREAT) {
    return 'good momentum'
  }
  if (score < SCORE_LABEL_GOLD) {
    return 'looking great'
  }
  return 'gold standard 🏆'
}

const nextScoreAboveNinetySince = (previous: string | null, score: number, nowMs: number): string | null => {
  if (score < SCORE_LABEL_GOLD) {
    return null
  }
  return previous ?? isoDate(nowMs)
}

const isoDate = (timeMs: number): string => {
  return new Date(timeMs).toISOString().slice(0, 10)
}
