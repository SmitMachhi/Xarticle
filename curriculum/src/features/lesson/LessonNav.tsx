interface Props {
  onNext: () => void
  onBack: () => void
  isFirst: boolean
  isLast: boolean
  current: number
  total: number
}

export default function LessonNav({ onNext, onBack, isFirst, isLast, current, total }: Props) {
  return (
    <div className="lesson-nav">
      <button className="btn-secondary" onClick={onBack} disabled={isFirst}>
        ← Back
      </button>
      <span className="lesson-nav-count">{current + 1} / {total}</span>
      <button className="btn-primary" onClick={onNext}>
        {isLast ? 'Take Quiz →' : 'Continue →'}
      </button>
    </div>
  )
}
