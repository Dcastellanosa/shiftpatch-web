import './StatusBadge.scss'
import { STATUS_LABEL, type ShiftStatus } from '../model/index.ts'

export function StatusBadge({ status }: { status: ShiftStatus }) {
  return <span className={`badge badge--${status}`}>{STATUS_LABEL[status]}</span>
}
