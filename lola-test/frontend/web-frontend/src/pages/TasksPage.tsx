import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import BottomNav from '@/components/BottomNav'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  category: string
  recurrence_type: string
  next_due: string | null
  assigned_to: string | null
  is_up_for_grabs: boolean
  effort_points: number
}

const CATEGORY_EMOJI: Record<string, string> = {
  kitchen: '🍳', laundry: '👕', hygiene: '🧼', tidying: '🧹',
  maintenance: '🔧', outdoor: '🌿', errands: '🛒', school: '📚',
  work: '💼', personal: '🙂', other: '📋',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  const [claiming, setClaiming] = useState<string | null>(null)

  const load = () => {
    void api.get<{ tasks: Task[] }>('/tasks').then((r) => {
      setTasks(r.tasks)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const complete = async (taskId: string) => {
    setCompleting(taskId)
    try {
      await api.post(`/tasks/${taskId}/complete`)
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    } finally {
      setCompleting(null)
    }
  }

  const claim = async (taskId: string) => {
    setClaiming(taskId)
    try {
      await api.post(`/tasks/${taskId}/claim`)
      load()
    } finally {
      setClaiming(null)
    }
  }

  return (
    <div className="flex flex-col flex-1 pb-20">
      <div className="px-5 pt-8 pb-4 border-b border-border">
        <h1 className="font-bold text-lg">Tasks</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && (
          <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
        )}
        {!loading && tasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No tasks yet 🎉</p>
        )}
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3 py-3 px-4 bg-secondary rounded-xl">
            <button
              onClick={() => { void complete(task.id) }}
              disabled={completing === task.id}
              className="w-5 h-5 rounded-full border-2 border-primary flex-shrink-0 hover:bg-primary/30 transition-colors text-xs"
            >
              {completing === task.id ? '…' : ''}
            </button>

            <span className="text-lg leading-none flex-shrink-0">
              {CATEGORY_EMOJI[task.category] ?? '📋'}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {task.next_due && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(task.next_due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  task.is_up_for_grabs ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground',
                )}>
                  {task.recurrence_type}
                </span>
              </div>
            </div>

            {task.is_up_for_grabs && (
              <button
                onClick={() => { void claim(task.id) }}
                disabled={claiming === task.id}
                className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
              >
                Claim
              </button>
            )}
          </div>
        ))}
      </div>

      <BottomNav active="tasks" />
    </div>
  )
}
