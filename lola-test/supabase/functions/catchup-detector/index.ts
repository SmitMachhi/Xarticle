import { realizeEdgeCopy } from '../_shared/copy.ts'
import { createServiceClient, pushToUserIds } from '../_shared/runtime.ts'

const DAYS_IDLE = 5
const MILLISECONDS_PER_DAY = 86_400_000

Deno.serve(async () => {
  const service = createServiceClient()
  const households = await service.from('households').select('id, catchup_pending').eq('is_active', true)
  if (households.error !== null || households.data === null) {
    return new Response(JSON.stringify({ ok: false }), { status: 500 })
  }

  const threshold = Date.now() - DAYS_IDLE * MILLISECONDS_PER_DAY
  for (const household of households.data) {
    if (household.catchup_pending) {
      continue
    }

    const members = await service.from('users').select('id, role, last_seen_at').eq('household_id', household.id)
    if (members.error !== null || members.data === null || members.data.length === 0) {
      continue
    }

    const allIdle = members.data.every((member) => Date.parse(member.last_seen_at) < threshold)
    if (!allIdle) {
      continue
    }

    await service.from('households').update({ catchup_pending: true }).eq('id', household.id)
    await service.from('feed_events').insert({
      event_type: 'catchup_triggered',
      household_id: household.id,
      payload: { reason: 'all_members_idle_5_days' },
    })
    const admins = members.data.filter((member) => member.role === 'admin').map((member) => member.id)
    if (admins.length === 0) {
      continue
    }

    const copy = await realizeEdgeCopy(
      {
        audience: 'admin',
        constraints: ['Keep it under 18 words.', 'Use a motivating tone.'],
        facts: { idle_days: DAYS_IDLE },
        intent: 'catchup_prompt',
        tone: 'sassy',
      },
      {
        body: "Lola's got some thoughts on the backlog 👀",
        push_body: "Lola's got some thoughts on the backlog 👀",
        push_title: 'Catch-up pending',
      },
    )

    await service.from('lola_messages').insert({
      actions: [
        { action: 'catchup_triage', label: 'Sort it out', requires_role: 'admin' },
        { action: 'catchup_clear', label: 'Fresh start', requires_role: 'admin' },
      ],
      content: copy.body,
      household_id: household.id,
      role: 'lola',
      user_id: admins[0],
    })
    await pushToUserIds(service, admins, {
      body: copy.push_body,
      title: copy.push_title,
    })
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})
