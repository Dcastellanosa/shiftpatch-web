import './ShiftWhen.scss'
import type { Shift } from '../../../shared/api/client/index.ts'
import { formatDuration, formatShiftDate, formatShiftTimes } from '../../../shared/lib/format/index.ts'

/** Date, local times (in the branch's zone) and duration of a shift. */
export function ShiftWhen({ shift }: { shift: Shift }) {
  const { startsAt, endsAt } = shift
  const zone = shift.branch.timezone
  return (
    <span className="when">
      <time dateTime={startsAt} className="when__date">
        {formatShiftDate(startsAt, zone)}
      </time>
      <span className="when__time">
        {formatShiftTimes(startsAt, endsAt, zone)} · {formatDuration(startsAt, endsAt)}
      </span>
    </span>
  )
}
