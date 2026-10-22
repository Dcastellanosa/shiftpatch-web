import './ShiftWhen.scss'
import type { Shift } from '../../../shared/api/client/index.ts'
import { formatLocalDate, formatLocalTimeRange, scheduledHours } from '../../../shared/lib/format/index.ts'

/** Facility-local date, times and length of a shift, shown exactly as the facility reads them. */
export function ShiftWhen({ shift }: { shift: Shift }) {
  const { date, startTime, endTime } = shift
  return (
    <span className="when">
      <time dateTime={date} className="when__date">
        {formatLocalDate(date)}
      </time>
      <span className="when__time">
        {formatLocalTimeRange(startTime, endTime)} · {scheduledHours(startTime, endTime)} h
      </span>
    </span>
  )
}
