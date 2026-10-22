import './CancelShiftControl.scss'
import { useId, useState } from 'react'
import type { CancellationReason } from '../../../shared/api/client/index.ts'
import { useCancelShift } from '../use-cancel-shift/index.ts'

interface CancelShiftControlProps {
  shiftId: string
  /** Agencies choose between an advance cancellation and a no-show; nurses only cancel in advance. */
  withReason?: boolean
}

/** One-click release of a filled shift, with an optional reason picker next to the button. */
export function CancelShiftControl({ shiftId, withReason = false }: CancelShiftControlProps) {
  const id = useId()
  const [reason, setReason] = useState<CancellationReason>('advance')
  const cancel = useCancelShift()
  const pending = cancel.isPending && cancel.variables?.shiftId === shiftId

  return (
    <div className="cancel-control">
      {withReason && (
        <select
          id={id}
          className="cancel-control__reason"
          aria-label="Cancellation reason"
          value={reason}
          onChange={(event) => setReason(event.target.value as CancellationReason)}
          disabled={pending}
        >
          <option value="advance">Cancelled in advance</option>
          <option value="no-show">No-show</option>
        </select>
      )}
      <button
        type="button"
        className="btn btn--secondary cancel-control__button"
        data-testid="shift-cancel-button"
        onClick={() => cancel.mutate({ shiftId, reason })}
        disabled={pending}
      >
        {pending ? 'Cancelling…' : 'Cancel shift'}
      </button>
    </div>
  )
}
