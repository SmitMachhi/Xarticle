import { createServiceClient } from '../_shared/runtime.ts'

Deno.serve(async () => {
  const supabase = createServiceClient()

  await supabase.from('users').update({ ring_progress: 0 }).neq('id', '')
  const households = await supabase.from('households').select('id, monthly_challenge')
  if (households.data !== null) {
    for (const household of households.data) {
      const challenge = household.monthly_challenge as { completed?: boolean; current_rate?: number; goal?: string } | null
      if (challenge?.completed === true) {
        await supabase.from('feed_events').insert({
          household_id: household.id,
          event_type: 'monthly_challenge_completed',
          payload: {
            completion_rate: challenge.current_rate ?? 0,
            goal: challenge.goal ?? 'monthly challenge',
          },
        })
      }
    }
  }

  await supabase.from('households').update({ family_ring_progress: 0, monthly_challenge: null }).neq('id', '')
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})
