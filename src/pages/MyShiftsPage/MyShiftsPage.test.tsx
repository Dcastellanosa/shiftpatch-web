// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { MyShiftsPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('shows empty upcoming and past sections', async () => {
  stubApi({ 'GET /api/me/shifts': () => json(200, { upcoming: [], past: [] }) })
  const { container } = renderWithProviders(<MyShiftsPage />, { path: '/my-shifts' })
  await screen.findByText('No upcoming shifts')
  expect(container.firstChild).toMatchSnapshot()
})

it('lists claimed shifts with their agency, local times and status', async () => {
  const mine = makeShift({
    id: 'shift-2',
    role: 'LPN',
    date: '2026-10-03',
    startTime: '07:00',
    endTime: '19:00',
    status: 'filled',
    claimedBy: 'nurse-1',
  })
  stubApi({ 'GET /api/me/shifts': () => json(200, { upcoming: [], past: [mine] }) })
  renderWithProviders(<MyShiftsPage />, { path: '/my-shifts' })
  expect(await screen.findByText('LPN')).toBeTruthy()
  expect(screen.getByText('Sunrise Health Staffing')).toBeTruthy()
  expect(screen.getByText('07:00 – 19:00 · 12 h')).toBeTruthy()
  expect(screen.getByText('Filled')).toBeTruthy()
})
