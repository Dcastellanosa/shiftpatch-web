// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { makeShift } from '../../../../tests/fake-api.ts'
import { ShiftWhen } from './index.ts'

it('renders the facility-local date, the overnight time range and the hours', () => {
  const { container } = render(<ShiftWhen shift={makeShift()} />)
  expect(screen.getByText('Thu, Jan 10, 2030')).toBeTruthy()
  expect(screen.getByText('19:00 – 07:00 (next day) · 12 h')).toBeTruthy()
  expect(container.firstChild).toMatchSnapshot()
})

it('renders a day shift without the next-day note', () => {
  render(<ShiftWhen shift={makeShift({ date: '2026-10-03', startTime: '07:00', endTime: '19:00' })} />)
  expect(screen.getByText('Sat, Oct 3, 2026')).toBeTruthy()
  expect(screen.getByText('07:00 – 19:00 · 12 h')).toBeTruthy()
})
