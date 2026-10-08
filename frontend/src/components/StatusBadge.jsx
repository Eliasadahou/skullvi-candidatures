import { STATUS_OPTIONS, labelOf } from '../utils/constants'

export default function StatusBadge({ status, label }) {
  return (
    <span className={`badge badge--${status}`}>
      {label || labelOf(STATUS_OPTIONS, status)}
    </span>
  )
}