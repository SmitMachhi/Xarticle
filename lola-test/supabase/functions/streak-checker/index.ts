import { realizeEdgeCopy } from '../_shared/copy.ts'
import { createServiceClient, localDate, localWeekdayAndHour } from '../_shared/runtime.ts'

const DAY_MS = 86_400_000
const MESSAGE_REPING_MS = 12 * 60 * 60 * 1000
const TARGET_HOUR = 23

Deno.serve(async () => {
  const service = createServiceClient()
  const households = await service.from('households').select('id, timezone, family_streak, streak_last_updated').eq('is_active', true)
  if (households.error !== null || households.data === null) {
    return new Response(JSON.stringify({ ok: false }), { status: 500 })
  }

  const now = new Date()
  for (const household of households.data) {
    await processHousehold(service, household.id, household.timezone, household.family_streak, household.streak_last_updated, now)
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})

const processHousehold = async (
  service: ReturnType<typeof createServiceClient>,
  householdId: string,
  timezone: string,
  familyStreak: number,
  streakLastUpdated: string | null,
  now: Date,
): Promise<void> => {
  const listIds = await fetchHouseholdListIds(service, householdId)
  if (listIds.length === 0) {
    return
  }

  const users = await service.from('users').select('id, role').eq('household_id', householdId)
  if (users.error !== null || users.data === null || users.data.length === 0) {
    return
  }

  const assignedMembers = await fetchAssignedMembers(service, householdId, listIds)
  if (assignedMembers.length === 0) {
    return
  }

  const completions = await service
    .from('completions')
    .select('completed_by, completed_at')
    .eq('household_id', householdId)
    .in('list_id', listIds)
    .gte('completed_at', new Date(now.getTime() - 3 * DAY_MS).toISOString())
  if (completions.error !== null || completions.data === null) {
    return
  }

  const today = localDate(now, timezone)
  const yesterday = localDate(new Date(now.getTime() - DAY_MS), timezone)
  const localHour = localWeekdayAndHour(now, timezone).hour
  const byMember = completionDaysByMember(completions.data, timezone)
  const missedYesterdayMembers = assignedMembers.filter((memberId) => {
    const days = byMember.get(memberId)
    return !(days?.has(yesterday) ?? false)
  })
  const missedTwoDayMembers = missedYesterdayMembers.filter((memberId) => {
    const days = byMember.get(memberId)
    return !(days?.has(today) ?? false)
  })

  const warningCopy = missedTwoDayMembers.length === 0
    ? null
    : await realizeEdgeCopy(
      {
        audience: 'household',
        constraints: ['Keep it under 20 words.', 'No guilt language.'],
        facts: { family_streak: familyStreak, local_hour: localHour, today },
        intent: 'streak_warning',
        tone: 'balanced',
      },
      {
        body: 'you have tasks due today or the family streak breaks',
      },
    )

  // Warn during the day when yesterday was missed and today's recovery is still open.
  if (localHour < TARGET_HOUR && warningCopy !== null) {
    await sendWarningNudge(service, householdId, users.data.map((user) => user.id), today, timezone, warningCopy.body)
  }

  if (localHour !== TARGET_HOUR) {
    return
  }

  const admin = users.data.find((user) => user.role === 'admin')
  if (admin !== undefined && missedTwoDayMembers.length > 0) {
    const adminCopy = await realizeEdgeCopy(
      {
        audience: 'admin',
        constraints: ['Ask for a clear decision with warm tone.', 'No blame.'],
        facts: { missed_members: missedTwoDayMembers.length, today },
        intent: 'streak_admin_prompt',
        tone: 'balanced',
      },
      { body: 'Streak check-in: someone missed two days. Want to protect this one?' },
    )
    await maybeSendAdminStreakMessage(service, householdId, admin.id, now, adminCopy.body)
  }

  const hasCompletionToday = completions.data.some((item) => localDate(item.completed_at, timezone) === today)
  if (!hasCompletionToday || streakLastUpdated === today) {
    return
  }

  await service.from('households').update({ family_streak: familyStreak + 1, streak_last_updated: today }).eq('id', householdId)
}

const fetchHouseholdListIds = async (service: ReturnType<typeof createServiceClient>, householdId: string): Promise<string[]> => {
  const lists = await service.from('lists').select('id').eq('household_id', householdId).eq('list_type', 'household')
  if (lists.error !== null || lists.data === null) {
    return []
  }
  return lists.data.map((list) => list.id)
}

const fetchAssignedMembers = async (
  service: ReturnType<typeof createServiceClient>,
  householdId: string,
  listIds: string[],
): Promise<string[]> => {
  const tasks = await service
    .from('tasks')
    .select('assigned_to')
    .eq('household_id', householdId)
    .eq('is_archived', false)
    .in('list_id', listIds)
    .not('assigned_to', 'is', null)
  if (tasks.error !== null || tasks.data === null) {
    return []
  }
  return [...new Set(tasks.data.map((task) => task.assigned_to).filter((value): value is string => value !== null))]
}

const completionDaysByMember = (
  rows: Array<{ completed_at: string; completed_by: string }>,
  timezone: string,
): Map<string, Set<string>> => {
  const byMember = new Map<string, Set<string>>()
  for (const row of rows) {
    const date = localDate(row.completed_at, timezone)
    const existing = byMember.get(row.completed_by) ?? new Set<string>()
    existing.add(date)
    byMember.set(row.completed_by, existing)
  }
  return byMember
}

const sendWarningNudge = async (
  service: ReturnType<typeof createServiceClient>,
  householdId: string,
  userIds: string[],
  today: string,
  timezone: string,
  message: string,
): Promise<void> => {
  const existing = await service
    .from('lola_messages')
    .select('id, user_id, created_at')
    .eq('household_id', householdId)
    .eq('role', 'lola')
    .eq('content', message)
    .gte('created_at', new Date(Date.now() - DAY_MS).toISOString())
  if (existing.error === null && existing.data !== null) {
    const already = new Set(existing.data.filter((row) => localDate(row.created_at, timezone) === today).map((row) => row.user_id))
    if (userIds.every((id) => already.has(id))) {
      return
    }
  }

  await service.from('lola_messages').insert(
    userIds.map((id) => ({
      content: message,
      household_id: householdId,
      role: 'lola',
      user_id: id,
    })),
  )
}

const maybeSendAdminStreakMessage = async (
  service: ReturnType<typeof createServiceClient>,
  householdId: string,
  adminId: string,
  now: Date,
  content: string,
): Promise<void> => {
  const existing = await service
    .from('lola_messages')
    .select('id, actions, created_at')
    .eq('household_id', householdId)
    .eq('user_id', adminId)
    .eq('role', 'lola')
    .order('created_at', { ascending: false })
    .limit(20)
  if (existing.error !== null || existing.data === null) {
    return
  }

  const unresolved = existing.data.find((message) => hasStreakActions(message.actions))
  if (unresolved !== undefined && Date.parse(unresolved.created_at) + MESSAGE_REPING_MS > now.getTime()) {
    return
  }

  await service.from('lola_messages').insert({
    actions: [
      { action: 'streak_shield', label: 'Let it slide', requires_role: 'admin' },
      { action: 'streak_accept', label: 'Fair enough', requires_role: 'admin' },
    ],
    content,
    household_id: householdId,
    role: 'lola',
    user_id: adminId,
  })
}

const hasStreakActions = (value: unknown): boolean => {
  if (!Array.isArray(value)) {
    return false
  }
  const actions = value
    .filter((item): item is { action?: string } => typeof item === 'object' && item !== null)
    .map((item) => item.action)
  return actions.includes('streak_shield') && actions.includes('streak_accept')
}
