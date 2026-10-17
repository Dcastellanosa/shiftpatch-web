import { describe, expect, it } from 'vitest'
import { addDays, formatDuration, zonedTimeToUtc } from '../src/lib/format.ts'

describe('zonedTimeToUtc', () => {
  it.each([
    ['2030-01-10', '08:00', 'America/New_York', '2030-01-10T13:00:00.000Z'], // EST, UTC-5
    ['2030-07-10', '08:00', 'America/New_York', '2030-07-10T12:00:00.000Z'], // EDT, UTC-4
    ['2030-07-10', '23:30', 'America/Los_Angeles', '2030-07-11T06:30:00.000Z'],
    ['2030-03-10', '12:00', 'America/New_York', '2030-03-10T16:00:00.000Z'], // DST starts that morning
    ['2030-01-10', '08:00', 'UTC', '2030-01-10T08:00:00.000Z'],
  ])('%s %s in %s → %s', (date, time, zone, expected) => {
    expect(zonedTimeToUtc(date, time, zone)).toBe(expected)
  })
})

describe('addDays', () => {
  it('rolls over months and years', () => {
    expect(addDays('2030-12-31', 1)).toBe('2031-01-01')
    expect(addDays('2030-03-01', -1)).toBe('2030-02-28')
  })
})

describe('formatDuration', () => {
  it('reports hours', () => {
    expect(formatDuration('2030-01-10T13:00:00Z', '2030-01-10T21:30:00Z')).toMatch(/^8[.,]5 h$/)
  })
})
