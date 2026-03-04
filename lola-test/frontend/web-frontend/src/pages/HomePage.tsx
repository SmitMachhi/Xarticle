import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import BottomNav from '@/components/BottomNav'

interface ScoreData {
  home_score: number
  label: string
  family_streak: number
  rings: { user_id: string; display_name: string; progress: number }[]
}

interface Task {
  id: string
  title: string
  category: string
  assigned_to: string | null
  next_due: string | null
}

export default function HomePage() {
  const navigate = useNavigate()
  const [score, setScore] = useState<ScoreData | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [completing, setCompleting] = useState<string | null>(null)

  useEffect(() => {
    void api.get<ScoreData>('/score').then(setScore).catch(console.error)
    void api.get<{ tasks: Task[] }>('/tasks').then((r) => { setTasks(r.tasks.slice(0, 5)) }).catch(console.error)
  }, [])

  const complete = async (taskId: string) => {
    setCompleting(taskId)
    try {
      await api.post(`/tasks/${taskId}/complete`)
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      void api.get<ScoreData>('/score').then(setScore)
    } finally {
      setCompleting(null)
    }
  }

  const scoreColor =
    (score?.home_score ?? 0) >= 90
      ? 'text-emerald-600'
      : (score?.home_score ?? 0) >= 75
        ? 'text-primary'
        : 'text-orange-500'

  return (
    <div className="flex flex-col flex-1 pb-20">
      {/* Score header */}
      <div className="px-5 pt-8 pb-4 space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Home Score</p>
        <div className="flex items-end gap-2">
          <span className={`text-5xl font-bold ${scoreColor}`}>{score?.home_score ?? '—'}</span>
          <span className="text-muted-foreground text-sm pb-2">{score?.label ?? ''}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>🔥</span>
          <span>{score?.family_streak ?? 0} day streak</span>
        </div>
      </div>

      {/* Ring progress */}
      {score?.rings && score.rings.length > 0 && (
        <div className="px-5 pb-4">
          <div className="flex gap-4">
            {score.rings.map((ring) => (
              <div key={ring.user_id} className="flex flex-col items-center gap-1">
                <div className="relative w-10 h-10">
                  <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke="hsl(var(--primary))" strokeWidth="3"
                      strokeDasharray={`${ring.progress} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[48px] text-center">
                  {ring.display_name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat with Lola CTA */}
      <div className="mx-5 mb-4">
        <button
          onClick={() => { navigate('/lola') }}
          className="w-full py-3 px-4 bg-secondary rounded-xl text-left text-sm text-muted-foreground hover:bg-accent transition-colors flex items-center gap-2"
        >
          <span className="text-lg">🤖</span>
          <span>Ask Lola anything…</span>
        </button>
      </div>

      {/* Today's tasks */}
      <div className="px-5 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Up next</p>
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">All caught up! 🎉</p>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 py-3 px-4 bg-secondary rounded-xl"
          >
            <button
              onClick={() => { void complete(task.id) }}
              disabled={completing === task.id}
              className="w-5 h-5 rounded-full border-2 border-primary flex-shrink-0 hover:bg-primary/20 transition-colors"
            >
              {completing === task.id && <span className="text-xs">…</span>}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              {task.next_due && (
                <p className="text-xs text-muted-foreground">
                  Due {new Date(task.next_due).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
        {tasks.length > 0 && (
          <button
            onClick={() => { navigate('/tasks') }}
            className="text-sm text-primary py-2"
          >
            See all tasks →
          </button>
        )}
      </div>

      <BottomNav active="home" />
    </div>
  )
}
