import { ShiftWhen } from '../components/ShiftWhen.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { EmptyState, ErrorState, LoadingState } from '../components/States.tsx'
import { listMyShifts, type Shift } from '../lib/api-client.ts'
import { useAsync } from '../lib/use-async.ts'

function ShiftList({ shifts }: { shifts: Shift[] }) {
  return (
    <ul className="card-list">
      {shifts.map((shift) => (
        <li key={shift.id} className="card shift-card">
          <div className="shift-card-main">
            <h3 className="card-title">{shift.title}</h3>
            <p className="shift-where">
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
  const mine = useAsync(listMyShifts, 'mine')

  return (
    <section className="page" aria-labelledby="mine-heading">
      <header className="page-header">
        <div>
          <h1 id="mine-heading">My Shifts</h1>
          <p className="muted">Shifts you have claimed.</p>
        </div>
      </header>

      {mine.error ? (
        <ErrorState error={mine.error} onRetry={mine.reload} />
      ) : !mine.data ? (
        <LoadingState label="Loading your shifts…" />
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
