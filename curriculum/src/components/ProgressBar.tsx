interface Props {
  current: number
  total: number
  label?: string
}

export default function ProgressBar({ current, total, label }: Props) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="progress-bar-wrap">
      {label && <span className="progress-bar-label">{label}</span>}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
      <span className="progress-bar-pct">{pct}%</span>
    </div>
  )
}
