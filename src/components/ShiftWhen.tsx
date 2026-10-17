import type { Shift } from '../lib/api-client.ts'
import { formatDuration, formatShiftDate, formatShiftTimes } from '../lib/format.ts'

/** Date, local times (in the branch's zone) and duration of a shift. */
export function ShiftWhen({ shift }: { shift: Shift }) {
  const { startsAt, endsAt } = shift
  const zone = shift.branch.timezone
  return (
    <span className="when">
      <time dateTime={startsAt} className="when-date">
        {formatShiftDate(startsAt, zone)}
      </time>
      <span className="when-time">
        {formatShiftTimes(startsAt, endsAt, zone)} · {formatDuration(startsAt, endsAt)}
      </span>
    </span>
  )
}
