// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { useUiStore } from '../../stores/ui-store/index.ts'
import { AvailableShiftsPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('shows the empty available-shifts state', async () => {
  stubApi({ 'GET /api/shifts': () => json(200, { shifts: [] }) })
  const { container } = renderWithProviders(<AvailableShiftsPage />, { path: '/shifts' })
  await screen.findByText('No open shifts right now')
  expect(container.firstChild).toMatchSnapshot()
})

it('lists open shifts from every agency with their agency name', async () => {
  stubApi({
    'GET /api/shifts': () =>
      json(200, {
        shifts: [
          makeShift(),
          makeShift({ id: 'shift-2', role: 'LPN', status: 'filled', claimedBy: 'nurse-1' }),
          makeShift({ id: 'shift-3', agencyId: 'agency-b', agencyName: 'Metro Care Partners' }),
        ],
      }),
  })
  renderWithProviders(<AvailableShiftsPage />, { path: '/shifts' })
  expect(await screen.findByText('Metro Care Partners')).toBeTruthy()
  expect(screen.getAllByTestId('shift-list-item')).toHaveLength(2)
  expect(screen.getAllByTestId('shift-claim-button')).toHaveLength(2)
  expect(screen.queryByText('LPN')).toBeNull()
})

it('claims in one click and refreshes the list', async () => {
  const shift = makeShift()
  let open = [shift]
  const fetchMock = stubApi({
    'GET /api/shifts': () => json(200, { shifts: open }),
    [`POST /api/shifts/${shift.id}/claim`]: () => {
      open = []
      return json(200, makeShift({ status: 'filled', claimedBy: 'nurse-1' }))
    },
  })
  renderWithProviders(<AvailableShiftsPage />, { path: '/shifts' })

  await userEvent.click(
    await screen.findByRole('button', { name: 'Claim RN on Thu, Jan 10, 2030 at Sunrise Health Staffing' }),
  )

  expect(await screen.findByText('No open shifts right now')).toBeTruthy()
  expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
    '/api/shifts',
    `/api/shifts/${shift.id}/claim`,
    '/api/shifts',
  ])
  expect(useUiStore.getState().toasts.map((t) => t.title)).toEqual(['Shift claimed'])
})

it('shows the API’s refusal in the notification queue and keeps the shift listed', async () => {
  const shift = makeShift({ id: 'shift-3' })
  stubApi({
    'GET /api/shifts': () => json(200, { shifts: [shift] }),
    [`POST /api/shifts/${shift.id}/claim`]: () => json(403, { error: 'Credential expired, cannot claim shift' }),
  })
  renderWithProviders(<AvailableShiftsPage />, { path: '/shifts' })

  await userEvent.click(await screen.findByRole('button', { name: /^Claim RN/ }))

  await vi.waitFor(() =>
    expect(useUiStore.getState().toasts).toEqual([
      expect.objectContaining({ kind: 'error', body: 'Credential expired, cannot claim shift' }),
    ]),
  )
  expect(screen.getByRole('button', { name: /^Claim RN/ })).toBeTruthy()
})
