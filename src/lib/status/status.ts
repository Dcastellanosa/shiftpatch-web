import type { ShiftStatus } from '../api-client/index.ts'

export const STATUS_LABEL: Record<ShiftStatus, string> = {
  open: 'Open',
  claimed: 'Claimed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No-show',
}

export const SHIFT_STATUSES = Object.keys(STATUS_LABEL) as ShiftStatus[]
