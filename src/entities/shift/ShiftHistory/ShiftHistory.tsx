import './ShiftHistory.scss'
import type { ShiftEvent } from '../../../shared/api/client/index.ts'
import { toApiError } from '../../../shared/api/errors/index.ts'
import { formatTimestamp } from '../../../shared/lib/format/index.ts'
import { ErrorState } from '../../../shared/ui/ErrorState/index.ts'
import { LoadingState } from '../../../shared/ui/LoadingState/index.ts'
import { useShiftEvents } from '../queries/index.ts'

const EVENT_LABEL: Record<ShiftEvent['eventType'], string> = {
  created: 'Created',
  claimed: 'Claimed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'Marked no-show',
}

/** Append-only audit trail for one shift. */
export function ShiftHistory({ shiftId }: { shiftId: string }) {
  const events = useShiftEvents(shiftId)

  if (events.data === undefined) {
    if (events.isError) return <ErrorState error={toApiError(events.error)} onRetry={() => void events.refetch()} />
    return <LoadingState label="Loading history…" />
  }
  if (events.data.length === 0) return <p className="muted">No history recorded.</p>

  return (
    <ol className="timeline" data-testid="shift-history">
      {events.data.map((event) => (
        <li key={event.id}>
          <span className="timeline__label">{EVENT_LABEL[event.eventType]}</span>
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
