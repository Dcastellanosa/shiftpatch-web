import { describe, expect, it } from 'vitest'
import { addDays, formatLocalDate, formatLocalTimeRange, isOvernight, scheduledHours } from './index.ts'

describe('formatLocalDate', () => {
  it('formats a facility-local date without any zone shift', () => {
    expect(formatLocalDate('2026-10-02')).toBe('Fri, Oct 2, 2026')
    expect(formatLocalDate('2030-01-10')).toBe('Thu, Jan 10, 2030')
    expect(formatLocalDate('2026-12-31')).toBe('Thu, Dec 31, 2026')
  })
})

describe('formatLocalTimeRange', () => {
  it('marks an end at or before the start as the next day', () => {
    expect(formatLocalTimeRange('19:00', '07:00')).toBe('19:00 – 07:00 (next day)')
    expect(formatLocalTimeRange('07:00', '19:00')).toBe('07:00 – 19:00')
    expect(formatLocalTimeRange('07:00', '07:00')).toBe('07:00 – 07:00 (next day)')
    expect(isOvernight('23:30', '00:15')).toBe(true)
  })
})

describe('scheduledHours', () => {
  it('counts hours across midnight and keeps two decimals', () => {
    expect(scheduledHours('19:00', '07:00')).toBe(12)
    expect(scheduledHours('07:00', '15:30')).toBe(8.5)
    expect(scheduledHours('08:00', '08:20')).toBe(0.33)
    expect(scheduledHours('07:00', '07:00')).toBe(24)
  })
})

describe('addDays', () => {
  it('rolls over months and years', () => {
    expect(addDays('2030-12-31', 1)).toBe('2031-01-01')
    expect(addDays('2030-03-01', -1)).toBe('2030-02-28')
  })
})
