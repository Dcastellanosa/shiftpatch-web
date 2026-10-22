// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

it('lets the nurse cancel an upcoming shift in advance, never a past one', async () => {
  const upcoming = makeShift({ id: 'shift-9', date: '2030-05-01', status: 'filled', claimedBy: 'nurse-1' })
  const past = makeShift({ id: 'shift-2', date: '2026-10-03', status: 'filled', claimedBy: 'nurse-1' })
  const fetchMock = stubApi({
    'GET /api/me/shifts': () => json(200, { upcoming: [upcoming], past: [past] }),
    'POST /api/shifts/shift-9/cancel': () => json(200, { ...upcoming, status: 'open', claimedBy: null }),
  })
  renderWithProviders(<MyShiftsPage />, { path: '/my-shifts' })
  await screen.findByText('Upcoming (1)')
  expect(screen.getAllByTestId('shift-cancel-button')).toHaveLength(1)

  await userEvent.click(screen.getByTestId('shift-cancel-button'))

  await vi.waitFor(() =>
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toContain('/api/shifts/shift-9/cancel'),
  )
  expect(JSON.parse(String(fetchMock.mock.calls.find(([url]) => String(url).endsWith('/cancel'))![1]?.body))).toEqual({
    reason: 'advance',
  })
})
