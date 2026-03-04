import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import BottomNav from '@/components/BottomNav'

interface FeedEvent {
  id: string
  event_type: string
  actor_id: string | null
  payload: Record<string, unknown>
  created_at: string
}

const EVENT_EMOJI: Record<string, string> = {
  task_completed: '✅',
  member_joined: '👋',
  badge_awarded: '🏅',
  ring_completed: '💍',
  streak_milestone: '🔥',
  streak_broken: '💔',
  home_score_milestone: '🏆',
  weekly_recap: '📊',
  catchup_triggered: '⚡️',
  catchup_completed: '🎯',
  monthly_challenge_completed: '🌟',
}

function eventLabel(event: FeedEvent): string {
  const p = event.payload
  switch (event.event_type) {
    case 'task_completed': return `completed "${p['task_title'] as string ?? 'a task'}"`
    case 'member_joined': return `${p['new_member_name'] as string ?? 'Someone'} joined the household`
    case 'badge_awarded': return `earned the ${p['badge_key'] as string ?? ''} badge`
    case 'ring_completed': return 'completed their activity ring!'
    case 'streak_milestone': return `hit a ${p['streak_days'] as number ?? 0}-day streak 🔥`
    case 'streak_broken': return 'streak reset'
    case 'weekly_recap': return 'Weekly recap is ready'
    default: return event.event_type.replace(/_/g, ' ')
  }
}

export default function FeedPage() {
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void api.get<{ events: FeedEvent[] }>('/feed').then((r) => {
      setEvents(r.events)
      setLoading(false)
    }).catch(console.error)
  }, [])

  return (
    <div className="flex flex-col flex-1 pb-20">
      <div className="px-5 pt-8 pb-4 border-b border-border">
        <h1 className="font-bold text-lg">Activity</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && (
          <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
        )}
        {!loading && events.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
        )}
        {events.map((event) => (
          <div key={event.id} className="flex items-start gap-3 py-3 px-4 bg-secondary rounded-xl">
            <span className="text-2xl leading-none flex-shrink-0 mt-0.5">
              {EVENT_EMOJI[event.event_type] ?? '📋'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{eventLabel(event)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(event.created_at).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <BottomNav active="feed" />
    </div>
  )
}
