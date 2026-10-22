// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { AdminShiftsPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('shows all status counts and the empty admin table', async () => {
  stubApi({ 'GET /api/shifts': () => json(200, { shifts: [] }) })
  const { container } = renderWithProviders(<AdminShiftsPage />, { path: '/admin/shifts' })
  await screen.findByText('No shifts match these filters')
  expect(container.firstChild).toMatchSnapshot()
})

it('reads filters from the URL and narrows the loaded list by status, agency and date', async () => {
  const open = makeShift()
  const filled = makeShift({ id: 'shift-2', role: 'LPN', date: '2030-01-11', status: 'filled', claimedBy: 'nurse-1' })
  const metro = makeShift({
    id: 'shift-3',
    agencyId: 'agency-b',
    agencyName: 'Metro Care Partners',
    date: '2030-02-01',
  })
  const fetchMock = stubApi({ 'GET /api/shifts': () => json(200, { shifts: [open, filled, metro] }) })
  renderWithProviders(<AdminShiftsPage />, { path: '/admin/shifts?status=filled' })

  const rows = await screen.findAllByRole('row')
  expect(rows).toHaveLength(2)
  expect(screen.getByTestId('admin-dashboard-shift-table')).toBeTruthy()
  expect(screen.getAllByTestId('admin-shift-status-badge')).toHaveLength(1)
  expect(screen.getByRole('button', { name: /Filled/ }).getAttribute('aria-pressed')).toBe('true')

  await userEvent.click(screen.getByRole('button', { name: /Filled/ }))
  expect(screen.getAllByRole('row')).toHaveLength(4)

  await userEvent.selectOptions(screen.getByLabelText('Agency'), 'agency-b')
  expect(window.location.search).toBe('?agency=agency-b')
  expect(screen.getAllByRole('row')).toHaveLength(2)
  expect(within(screen.getByRole('table')).getByText('Metro Care Partners')).toBeTruthy()

  await userEvent.click(screen.getByRole('button', { name: 'Clear Filters' }))
  expect(window.location.search).toBe('')
  expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(['/api/shifts'])
})
