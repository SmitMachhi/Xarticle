import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

type Tab = 'home' | 'tasks' | 'lola' | 'feed' | 'settings'

const TABS: { id: Tab; label: string; emoji: string; path: string }[] = [
  { id: 'home', label: 'Home', emoji: '🏠', path: '/home' },
  { id: 'tasks', label: 'Tasks', emoji: '✅', path: '/tasks' },
  { id: 'lola', label: 'Lola', emoji: '🤖', path: '/lola' },
  { id: 'feed', label: 'Feed', emoji: '⚡️', path: '/feed' },
  { id: 'settings', label: 'More', emoji: '⚙️', path: '/settings' },
]

export default function BottomNav({ active }: { active: Tab }) {
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-background border-t border-border flex">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => { navigate(tab.path) }}
          className={cn(
            'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors',
            active === tab.id ? 'text-primary font-semibold' : 'text-muted-foreground',
          )}
        >
          <span className="text-xl leading-none">{tab.emoji}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
