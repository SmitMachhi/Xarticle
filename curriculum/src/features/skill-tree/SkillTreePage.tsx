import { MODULES } from '../../data/modules.ts'
import { isModuleLocked, isModuleCompleted } from '../../lib/progress.ts'
import { useProgressContext } from '../../hooks/useProgressContext.ts'
import { useXP } from '../../hooks/useXP.ts'
import ModuleCard from './ModuleCard.tsx'
import ProgressBar from '../../components/ProgressBar.tsx'

export default function SkillTreePage() {
  const { progress, reset } = useProgressContext()
  const { totalXP, levelName, xpInLevel, xpNeeded } = useXP(progress)
  const completedCount = progress.completedModules.length

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Backend Engineering 101</h1>
        <p className="page-subtitle">Learn how this very app works, from first principles.</p>
      </header>

      <div className="xp-header card" style={{ marginBottom: 24 }}>
        <div className="xp-header-row">
          <span className="xp-level-badge">{levelName}</span>
          <span className="xp-total">{totalXP} XP</span>
        </div>
        <ProgressBar current={xpInLevel} total={xpNeeded} label={`${completedCount}/${MODULES.length} modules`} />
      </div>

      <div className="module-grid">
        {MODULES.map(mod => (
          <ModuleCard
            key={mod.id}
            module={mod}
            locked={isModuleLocked(progress, mod.id)}
            completed={isModuleCompleted(progress, mod.id)}
          />
        ))}
      </div>

      {completedCount > 0 && (
        <button
          className="btn-secondary"
          style={{ marginTop: 32, fontSize: '0.8rem' }}
          onClick={reset}
        >
          Reset progress
        </button>
      )}
    </div>
  )
}
