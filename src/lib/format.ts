/** Date helpers. Shift times are stored in UTC and shown in the branch's time zone. */

const HOUR_MS = 3_600_000

export function formatShiftDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone }).format(
    new Date(iso),
  )
}

export function formatShiftTimes(startsAt: string, endsAt: string, timeZone: string): string {
  const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone })
  const zone = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short', timeZone })
    .formatToParts(new Date(startsAt))
    .find((part) => part.type === 'timeZoneName')?.value
  return `${time.format(new Date(startsAt))} – ${time.format(new Date(endsAt))}${zone ? ` ${zone}` : ''}`
}

export function formatDuration(startsAt: string, endsAt: string): string {
  const hours = (Date.parse(endsAt) - Date.parse(startsAt)) / HOUR_MS
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(hours)} h`
}

export function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

/** Offset (ms) of `timeZone` from UTC at `instant`. */
function zoneOffset(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant))
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asUtc - instant
}

/**
 * Converts a wall-clock date and time in `timeZone` (e.g. a branch's zone) to
 * an ISO UTC instant. `date` is `YYYY-MM-DD`, `time` is `HH:MM`.
 */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const wallClock = Date.UTC(y!, m! - 1, d!, hh!, mm!)
  // Two passes settle the offset across DST transitions.
  let instant = wallClock - zoneOffset(wallClock, timeZone)
  instant = wallClock - zoneOffset(instant, timeZone)
  return new Date(instant).toISOString()
}

/** Adds whole days to a `YYYY-MM-DD` date string. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d! + days)).toISOString().slice(0, 10)
}
