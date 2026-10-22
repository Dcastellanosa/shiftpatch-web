import './StatusBadge.scss'
import { STATUS_LABEL, type ShiftStatus } from '../model/index.ts'

export function StatusBadge({ status, testId }: { status: ShiftStatus; testId?: string }) {
  return (
    <span className={`badge badge--${status}`} data-testid={testId}>
      {STATUS_LABEL[status]}
    </span>
  )
}
