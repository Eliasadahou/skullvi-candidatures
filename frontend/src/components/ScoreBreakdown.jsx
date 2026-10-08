import { CRITERIA_LABELS } from '../utils/constants'

export default function ScoreBreakdown({ details }) {
  if (!details) return null
  return (
    <ul className="breakdown">
      {Object.entries(CRITERIA_LABELS).map(([key, label]) => {
        const d = details[key]
        if (!d) return null
        const pct = d.max ? Math.round((d.points / d.max) * 100) : 0
        return (
          <li key={key}>
            <div className="breakdown__row">
              <span>{label}</span>
              <strong>{d.points} / {d.max}</strong>
            </div>
            <div
              className="bar"
              role="progressbar"
              aria-label={label}
              aria-valuemin={0}
              aria-valuemax={d.max}
              aria-valuenow={d.points}
            >
              <div className="bar__fill" style={{ width: `${pct}%` }} />
            </div>
            {key === 'skills' && d.matched?.length > 0 && (
              <p className="hint">Reconnues : {d.matched.join(', ')}</p>
            )}
          </li>
        )
      })}
    </ul>
  )
}