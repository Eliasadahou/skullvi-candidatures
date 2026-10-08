import { CATEGORY_OPTIONS, labelOf } from '../utils/constants'

export default function ScoreBadge({ category, label }) {
  return (
    <span className={`badge badge--${category}`}>
      {label || labelOf(CATEGORY_OPTIONS, category)}
    </span>
  )
}