import './AvailableShiftsPage.scss'
import { useState } from 'react'
import { ShiftWhen } from '../../entities/shift/ShiftWhen/index.ts'
import { ClaimDialog } from '../../features/shifts/ClaimDialog/index.ts'
import { useAvailableShifts } from '../../features/shifts/use-available-shifts/index.ts'
import type { Shift } from '../../shared/api/client/index.ts'
import { toApiError } from '../../shared/api/errors/index.ts'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'
import { ErrorState } from '../../shared/ui/ErrorState/index.ts'
import { LoadingState } from '../../shared/ui/LoadingState/index.ts'

export function AvailableShiftsPage() {
  const shifts = useAvailableShifts()
  const [claiming, setClaiming] = useState<Shift | null>(null)
  const reload = () => void shifts.refetch()

  return (
    <section className="page" aria-labelledby="available-heading">
      <header className="page__header">
        <div>
          <h1 id="available-heading">Available Shifts</h1>
          <p className="muted">Open shifts at branches where you are active.</p>
        </div>
        <button type="button" className="btn btn--secondary" onClick={reload} disabled={shifts.isFetching}>
          Refresh
        </button>
      </header>

      {shifts.data === undefined ? (
        shifts.isError ? (
          <ErrorState error={toApiError(shifts.error)} onRetry={reload} />
        ) : (
          <LoadingState label="Loading shifts…" />
        )
      ) : shifts.data.length === 0 ? (
        <EmptyState title="No open shifts right now">
          New shifts appear here when an agency you work with posts them.
        </EmptyState>
      ) : (
        <ul className="card-list">
          {shifts.data.map((shift) => (
            <li key={shift.id} className="card shift-card">
              <div className="shift-card__main">
                <h2 className="card__title">{shift.title}</h2>
                <p className="shift-card__where">
                  <span>{shift.branch.name}</span>
                  <span className="muted"> · {shift.agency.name}</span>
                </p>
                <ShiftWhen shift={shift} />
              </div>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setClaiming(shift)}
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
          onClaimed={() => setClaiming(null)}
          onClose={(failed) => {
            setClaiming(null)
            if (failed) reload()
          }}
        />
      )}
    </section>
  )
}
