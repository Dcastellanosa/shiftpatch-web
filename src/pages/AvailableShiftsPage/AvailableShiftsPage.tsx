import './AvailableShiftsPage.scss'
import { useState } from 'react'
import { ClaimDialog } from '../../components/ClaimDialog/ClaimDialog.tsx'
import { Link } from '../../components/Link/Link.tsx'
import { ShiftWhen } from '../../components/ShiftWhen/ShiftWhen.tsx'
import { EmptyState } from '../../components/EmptyState/EmptyState.tsx'
import { ErrorState } from '../../components/ErrorState/ErrorState.tsx'
import { LoadingState } from '../../components/LoadingState/LoadingState.tsx'
import { listShifts, type Shift } from '../../lib/api-client/api-client.ts'
import { useAsync } from '../../lib/use-async/use-async.ts'

export function AvailableShiftsPage() {
  const shifts = useAsync(() => listShifts(), 'available')
  const [claiming, setClaiming] = useState<Shift | null>(null)
  const [claimed, setClaimed] = useState<Shift | null>(null)

  return (
    <section className="page" aria-labelledby="available-heading">
      <header className="page-header">
        <div>
          <h1 id="available-heading">Available Shifts</h1>
          <p className="muted">Open shifts at branches where you are active.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={shifts.reload} disabled={shifts.loading}>
          Refresh
        </button>
      </header>

      <div aria-live="polite">
        {claimed && (
          <div className="notice notice-success">
            <p className="notice-title">Shift claimed</p>
            <p>
              {claimed.title} at {claimed.branch.name} is now yours. <Link to="/my-shifts">View My Shifts</Link>
            </p>
          </div>
        )}
      </div>

      {shifts.error ? (
        <ErrorState error={shifts.error} onRetry={shifts.reload} />
      ) : !shifts.data ? (
        <LoadingState label="Loading shifts…" />
      ) : shifts.data.length === 0 ? (
        <EmptyState title="No open shifts right now">
          New shifts appear here when an agency you work with posts them.
        </EmptyState>
      ) : (
        <ul className="card-list">
          {shifts.data.map((shift) => (
            <li key={shift.id} className="card shift-card">
              <div className="shift-card-main">
                <h2 className="card-title">{shift.title}</h2>
                <p className="shift-where">
                  <span>{shift.branch.name}</span>
                  <span className="muted"> · {shift.agency.name}</span>
                </p>
                <ShiftWhen shift={shift} />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setClaimed(null)
                  setClaiming(shift)
                }}
                aria-label={`Claim ${shift.title} at ${shift.branch.name}`}
              >
                Claim
              </button>
            </li>
          ))}
        </ul>
      )}

      {claiming && (
        <ClaimDialog
          shift={claiming}
          onClaimed={(shift) => {
            setClaiming(null)
            setClaimed(shift)
            shifts.reload()
          }}
          onClose={(failed) => {
            setClaiming(null)
            if (failed) shifts.reload()
          }}
        />
      )}
    </section>
  )
}
