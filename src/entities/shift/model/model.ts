import type { ShiftStatus } from '../../../shared/api/client/index.ts'

export type {
  CancellationReason,
  Shift,
  ShiftEvent,
  ShiftEventType,
  ShiftStatus,
} from '../../../shared/api/client/index.ts'

/** The two public statuses: a cancellation reopens a shift, nothing else exists on the wire. */
export const STATUS_LABEL: Record<ShiftStatus, string> = {
  open: 'Open',
  filled: 'Filled',
}

export const SHIFT_STATUSES = Object.keys(STATUS_LABEL) as ShiftStatus[]
