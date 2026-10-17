import { useEffect, useId, useRef, useState } from 'react'
import { claimShift, type ApiError, type Shift } from '../lib/api-client.ts'
import { describeClaimError, toApiError } from '../lib/errors.ts'
import { ShiftWhen } from './ShiftWhen.tsx'

interface ClaimDialogProps {
  shift: Shift
  onClaimed: (shift: Shift) => void
  /** `failed` is the last error, so the list can refresh after a conflict. */
  onClose: (failed: ApiError | null) => void
}

/** Confirmation step before claiming. The API performs every eligibility check atomically. */
export function ClaimDialog({ shift, onClaimed, onClose }: ClaimDialogProps) {
  const titleId = useId()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  async function confirm() {
    setSubmitting(true)
    setError(null)
    try {
      onClaimed(await claimShift(shift.id))
    } catch (caught) {
      setError(toApiError(caught))
      setSubmitting(false)
    }
  }

  const friendly = error ? describeClaimError(error) : null
  const canRetry = !error || error.status === 0 || error.status >= 500

  return (
    <div className="modal-backdrop">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !submitting) onClose(error)
        }}
      >
        <h2 id={titleId}>Claim This Shift?</h2>
        <dl className="summary">
          <dt>Shift</dt>
          <dd>{shift.title}</dd>
          <dt>Where</dt>
          <dd>
            {shift.branch.name} · {shift.agency.name}
            <span className="muted block">{shift.branch.address}</span>
          </dd>
          <dt>When</dt>
          <dd>
            <ShiftWhen shift={shift} />
          </dd>
        </dl>

        {friendly && (
          <div className="notice notice-error" role="alert">
            <p className="notice-title">{friendly.title}</p>
            <p>{friendly.detail}</p>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => onClose(error)} disabled={submitting}>
            {error ? 'Close' : 'Cancel'}
          </button>
          {canRetry && (
            <button ref={confirmRef} type="button" className="btn btn-primary" onClick={() => void confirm()} disabled={submitting}>
              {submitting ? 'Claiming…' : error ? 'Try Again' : 'Confirm Claim'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
