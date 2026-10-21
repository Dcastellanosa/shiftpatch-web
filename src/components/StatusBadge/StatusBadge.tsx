import './StatusBadge.scss'
import type { ShiftStatus } from '../../lib/api-client/index.ts'
import { STATUS_LABEL } from '../../lib/status/index.ts'

export function StatusBadge({ status }: { status: ShiftStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
}
