import { useLocation, useNavigate, useParams, Link } from 'react-router-dom'
import { MODULES } from '../../data/modules.ts'
import { isPassing, getXPForRun, starCount } from '../../lib/progress.ts'

interface ResultState {
  score: number
  total: number
}

export default function QuizResult() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const moduleId = Number(id)

  const state = location.state as ResultState | null
  const score = state?.score ?? 0
  const total = state?.total ?? 5

  const passing = isPassing(score)
  const xp = getXPForRun(score, total)
  const stars = starCount(score, total)
  const nextModuleId = moduleId + 1
  const hasNext = MODULES.some(m => m.id === nextModuleId)

  return (
    <div className="page result-page">
      <div className="result-stars">
        {[1, 2, 3].map(s => (
          <span key={s} className={`result-star ${s <= stars ? 'result-star--lit' : ''}`}>★</span>
        ))}
      </div>

      <h1 className="result-heading animate-pop">
        {passing ? 'Nailed it!' : 'So close...'}
      </h1>

      <p className="result-score">
        {score} / {total} correct
      </p>

      {passing && xp > 0 && (
        <div className="result-xp animate-pop">
          +{xp} XP
        </div>
      )}

      {!passing && (
        <p className="result-tip">You need 4/5 to pass. Review the lesson and try again.</p>
      )}

      <div className="result-actions">
        {passing && hasNext ? (
          <button className="btn-primary" onClick={() => navigate(`/module/${nextModuleId}/lesson`)}>
            Next Module →
          </button>
        ) : passing ? (
          <Link to="/" className="btn-primary">Back to Modules →</Link>
        ) : null}

        <button className="btn-secondary" onClick={() => navigate(`/module/${moduleId}/quiz`)}>
          {passing ? 'Retry Quiz' : 'Try Again'}
        </button>

        <Link to={`/module/${moduleId}/lesson`} className="btn-secondary">
          Review Lesson
        </Link>
      </div>
    </div>
  )
}
