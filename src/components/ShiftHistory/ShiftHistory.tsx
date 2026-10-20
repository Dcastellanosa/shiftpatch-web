import './ShiftHistory.scss'
import { listShiftEvents, type ShiftEvent } from '../../lib/api-client/api-client.ts'
import { formatTimestamp } from '../../lib/format/format.ts'
import { useAsync } from '../../lib/use-async/use-async.ts'
import { ErrorState } from '../ErrorState/ErrorState.tsx'
import { LoadingState } from '../LoadingState/LoadingState.tsx'

const EVENT_LABEL: Record<ShiftEvent['eventType'], string> = {
  created: 'Created',
  claimed: 'Claimed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'Marked no-show',
}

/** Append-only audit trail for one shift. */
export function ShiftHistory({ shiftId }: { shiftId: string }) {
  const events = useAsync(() => listShiftEvents(shiftId), shiftId)

  if (events.error) return <ErrorState error={events.error} onRetry={events.reload} />
  if (!events.data) return <LoadingState label="Loading history…" />
  if (events.data.length === 0) return <p className="muted">No history recorded.</p>

  return (
    <ol className="timeline">
      {events.data.map((event) => (
        <li key={event.id}>
          <span className="timeline-label">{EVENT_LABEL[event.eventType]}</span>
          <span className="muted">
            {' '}
            by {event.actor.fullName ?? 'a team member'} · <time dateTime={event.occurredAt}>{formatTimestamp(event.occurredAt)}</time>
          </span>
          {event.reason && <p className="small">{event.reason}</p>}
        </li>
      ))}
    </ol>
  )
}
