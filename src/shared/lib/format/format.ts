/**
 * Date helpers. Shift dates and times are facility-local wall-clock values
 * (`YYYY-MM-DD`, `HH:MM`) and are shown as they are: no time zone conversion.
 */

const MINUTES_PER_DAY = 24 * 60

function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h! * 60 + m!
}

/** A facility-local date (`2026-10-02`) as "Fri, Oct 2, 2026", independent of the viewer's zone. */
export function formatLocalDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y!, m! - 1, d!)))
}

/** Whether a shift ends on the following day (end at or before start). */
export const isOvernight = (startTime: string, endTime: string) => minutesOf(endTime) <= minutesOf(startTime)

/** "19:00 – 07:00 (next day)" for an overnight shift, "07:00 – 19:00" otherwise. */
export function formatLocalTimeRange(startTime: string, endTime: string): string {
  return `${startTime} – ${endTime}${isOvernight(startTime, endTime) ? ' (next day)' : ''}`
}

/** Hours between two facility-local times, rolling over midnight; two decimals at most. */
export function scheduledHours(startTime: string, endTime: string): number {
  const minutes = minutesOf(endTime) - minutesOf(startTime)
  return Math.round(((minutes <= 0 ? minutes + MINUTES_PER_DAY : minutes) / 60) * 100) / 100
}

export function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

/** Adds whole days to a `YYYY-MM-DD` date string. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d! + days)).toISOString().slice(0, 10)
}

/** Today as a `YYYY-MM-DD` string in UTC. */
export const todayUtc = () => new Date().toISOString().slice(0, 10)
