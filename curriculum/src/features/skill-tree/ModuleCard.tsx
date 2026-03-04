import { useNavigate } from 'react-router-dom'
import type { ModuleMeta } from '../../types/curriculum.ts'

interface Props {
  module: ModuleMeta
  locked: boolean
  completed: boolean
}

export default function ModuleCard({ module, locked, completed }: Props) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (locked) return
    navigate(`/module/${module.id}/lesson`)
  }

  const statusLabel = completed ? '✓ Done' : locked ? '🔒 Locked' : 'Start →'

  return (
    <button
      className={`module-card ${locked ? 'module-card--locked' : ''} ${completed ? 'module-card--done' : ''}`}
      onClick={handleClick}
      disabled={locked}
      aria-label={`${module.title} — ${locked ? 'locked' : completed ? 'completed' : 'start lesson'}`}
    >
      <span className="module-card-icon">{module.icon}</span>
      <div className="module-card-body">
        <span className="module-card-num">Module {module.id}</span>
        <span className="module-card-title">{module.title}</span>
        <span className="module-card-desc">{module.description}</span>
      </div>
      <span className={`module-card-status ${completed ? 'status-done' : locked ? 'status-locked' : 'status-open'}`}>
        {statusLabel}
      </span>
    </button>
  )
}
