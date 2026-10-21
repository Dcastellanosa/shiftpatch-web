// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { AdminShiftsPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('shows all status counts and the empty admin table', async () => {
  stubApi({
    'GET /api/branches': () => json(200, { branches: [] }),
    'GET /api/shifts': () => json(200, { shifts: [] }),
  })
  const { container } = renderWithProviders(<AdminShiftsPage />, { path: '/admin/shifts' })
  await screen.findByText('No shifts match these filters')
  expect(container.firstChild).toMatchSnapshot()
})

it('reads filters from the URL and keeps rows visible while a new filter loads', async () => {
  const open = makeShift()
  const claimed = makeShift({ id: 'shift-2', status: 'claimed', assignedNurse: { id: 'u-nurse', fullName: 'Ava Thompson' } })
  const fetchMock = stubApi({
    'GET /api/branches': () =>
      json(200, { branches: [{ id: 'branch-1', name: 'Downtown Clinic', address: '120 Main Street', timezone: 'America/New_York', agency: open.agency }] }),
    'GET /api/shifts': () => json(200, { shifts: [open, claimed] }),
  })
  renderWithProviders(<AdminShiftsPage />, { path: '/admin/shifts?status=claimed' })

  const rows = await screen.findAllByRole('row')
  expect(rows).toHaveLength(2)
  expect(screen.getByRole('button', { name: /Claimed/ }).getAttribute('aria-pressed')).toBe('true')

  await userEvent.selectOptions(screen.getByLabelText('Branch'), 'branch-1')

  expect(window.location.search).toBe('?status=claimed&branch=branch-1')
  await vi.waitFor(() => expect(fetchMock.mock.calls.map(([url]) => String(url))).toContain('/api/shifts?branchId=branch-1'))
  expect(screen.getAllByRole('row')).toHaveLength(2)

  await userEvent.click(screen.getByRole('button', { name: 'Clear Filters' }))
  expect(window.location.search).toBe('')
})
