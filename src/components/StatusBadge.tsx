import type { ShiftStatus } from '../lib/api-client.ts'
import { STATUS_LABEL } from '../lib/status.ts'

export function StatusBadge({ status }: { status: ShiftStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
}
