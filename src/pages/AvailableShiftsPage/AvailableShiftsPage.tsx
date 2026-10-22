import './AvailableShiftsPage.scss'
import { ShiftWhen } from '../../entities/shift/ShiftWhen/index.ts'
import { useAvailableShifts } from '../../features/shifts/use-available-shifts/index.ts'
import { useClaimShift } from '../../features/shifts/use-claim-shift/index.ts'
import { toApiError } from '../../shared/api/errors/index.ts'
import { formatLocalDate } from '../../shared/lib/format/index.ts'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'
import { ErrorState } from '../../shared/ui/ErrorState/index.ts'
import { LoadingState } from '../../shared/ui/LoadingState/index.ts'

/** The marketplace: open shifts from every agency. One click claims; the banner reports the outcome. */
export function AvailableShiftsPage() {
  const shifts = useAvailableShifts()
  const claim = useClaimShift()
  const reload = () => void shifts.refetch()

  return (
    <section className="page" aria-labelledby="available-heading">
      <header className="page__header">
        <div>
          <h1 id="available-heading">Available Shifts</h1>
          <p className="muted">Open shifts from every agency. Claim one and it is yours.</p>
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
          New shifts appear here as soon as an agency posts them.
        </EmptyState>
      ) : (
        <ul className="card-list">
          {shifts.data.map((shift) => {
            const claiming = claim.isPending && claim.variables === shift.id
            return (
              <li key={shift.id} className="card shift-card" data-testid="shift-list-item">
                <div className="shift-card__main">
                  <h2 className="card__title">{shift.role}</h2>
                  <p className="shift-card__where">{shift.agencyName}</p>
                  <ShiftWhen shift={shift} />
                </div>
                <button
                  type="button"
                  className="btn btn--primary"
                  data-testid="shift-claim-button"
                  onClick={() => claim.mutate(shift.id)}
                  disabled={claiming}
                  aria-label={`Claim ${shift.role} on ${formatLocalDate(shift.date)} at ${shift.agencyName}`}
                >
                  {claiming ? 'Claiming…' : 'Claim'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
