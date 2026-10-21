import './MyShiftsPage.scss'
import { ShiftWhen } from '../../entities/shift/ShiftWhen/index.ts'
import { StatusBadge } from '../../entities/shift/StatusBadge/index.ts'
import { useMyShifts } from '../../features/shifts/use-my-shifts/index.ts'
import type { Shift } from '../../shared/api/client/index.ts'
import { toApiError } from '../../shared/api/errors/index.ts'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'
import { ErrorState } from '../../shared/ui/ErrorState/index.ts'
import { LoadingState } from '../../shared/ui/LoadingState/index.ts'

function ShiftList({ shifts }: { shifts: Shift[] }) {
  return (
    <ul className="card-list">
      {shifts.map((shift) => (
        <li key={shift.id} className="card shift-card">
          <div className="shift-card__main">
            <h3 className="card__title">{shift.title}</h3>
            <p className="shift-card__where">
              <span>{shift.branch.name}</span>
              <span className="muted"> · {shift.agency.name}</span>
            </p>
            <p className="muted small">{shift.branch.address}</p>
            <ShiftWhen shift={shift} />
          </div>
          <StatusBadge status={shift.status} />
        </li>
      ))}
    </ul>
  )
}

export function MyShiftsPage() {
  const mine = useMyShifts()

  return (
    <section className="page" aria-labelledby="mine-heading">
      <header className="page__header">
        <div>
          <h1 id="mine-heading">My Shifts</h1>
          <p className="muted">Shifts you have claimed.</p>
        </div>
      </header>

      {mine.data === undefined ? (
        mine.isError ? (
          <ErrorState error={toApiError(mine.error)} onRetry={() => void mine.refetch()} />
        ) : (
          <LoadingState label="Loading your shifts…" />
        )
      ) : (
        <>
          <section aria-labelledby="upcoming-heading" className="section">
            <h2 id="upcoming-heading">Upcoming ({mine.data.upcoming.length})</h2>
            {mine.data.upcoming.length === 0 ? (
              <EmptyState title="No upcoming shifts">Claim an open shift to see it here.</EmptyState>
            ) : (
              <ShiftList shifts={mine.data.upcoming} />
            )}
          </section>
          <section aria-labelledby="past-heading" className="section">
            <h2 id="past-heading">Past ({mine.data.past.length})</h2>
            {mine.data.past.length === 0 ? (
              <EmptyState title="No past shifts yet" />
            ) : (
              <ShiftList shifts={mine.data.past} />
            )}
          </section>
        </>
      )}
    </section>
  )
}
