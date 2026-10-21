// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { AvailableShiftsPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('shows the empty available-shifts state', async () => {
  stubApi({ 'GET /api/shifts': () => json(200, { shifts: [] }) })
  const { container } = renderWithProviders(<AvailableShiftsPage />, { path: '/shifts' })
  await screen.findByText('No open shifts right now')
  expect(container.firstChild).toMatchSnapshot()
})

it('refreshes the list after a successful claim', async () => {
  const shift = makeShift()
  let open = [shift]
  const fetchMock = stubApi({
    'GET /api/shifts': () => json(200, { shifts: open }),
    [`POST /api/shifts/${shift.id}/claim`]: () => {
      open = []
      return json(200, { shift: makeShift({ status: 'claimed' }) })
    },
  })
  renderWithProviders(<AvailableShiftsPage />, { path: '/shifts' })

  await userEvent.click(await screen.findByRole('button', { name: `Claim ${shift.title} at ${shift.branch.name}` }))
  await userEvent.click(screen.getByRole('button', { name: 'Confirm Claim' }))

  expect(await screen.findByText('No open shifts right now')).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(['/api/shifts', `/api/shifts/${shift.id}/claim`, '/api/shifts'])
})
