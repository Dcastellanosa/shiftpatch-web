// @vitest-environment jsdom
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { AGENCY, json, makeBranch, makeShift, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { useUiStore } from '../../stores/ui-store/index.ts'
import { AgencyShiftsPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

const render = () => renderWithProviders(<AgencyShiftsPage />, { path: '/agency/shifts', session: true, user: AGENCY })

it('shows the agency page with the post-shift button and no shifts', async () => {
  stubApi({
    'GET /api/branches': () => json(200, { branches: [makeBranch()] }),
    'GET /api/agencies/agency-a/shifts': () => json(200, { agencyId: 'agency-a', shifts: [] }),
  })
  const { container } = render()
  await screen.findByText('No shifts match')
  expect(screen.getByTestId('agency-post-shift-button')).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(container.firstChild).toMatchSnapshot()
})

it('posts a shift from the modal, closes it and refreshes the agency list', async () => {
  let shifts = [] as ReturnType<typeof makeShift>[]
  const fetchMock = stubApi({
    'GET /api/branches': () => json(200, { branches: [makeBranch()] }),
    'GET /api/agencies/agency-a/shifts': () => json(200, { agencyId: 'agency-a', shifts }),
    'POST /api/shifts': () => {
      shifts = [makeShift({ id: 'shift-4', role: 'CNA', date: '2026-10-05', startTime: '07:00', endTime: '19:00' })]
      return json(201, shifts[0])
    },
  })
  render()
  await screen.findByText('No shifts match')

  await userEvent.click(screen.getByTestId('agency-post-shift-button'))
  const dialog = screen.getByRole('dialog', { name: 'Post a shift' })
  await userEvent.type(within(dialog).getByLabelText('Role'), 'CNA')
  fireEvent.change(within(dialog).getByLabelText('Date'), { target: { value: '2026-10-05' } })
  fireEvent.change(within(dialog).getByLabelText('Start'), { target: { value: '07:00' } })
  fireEvent.change(within(dialog).getByLabelText('End'), { target: { value: '19:00' } })
  await userEvent.click(screen.getByTestId('agency-post-shift-submit-button'))

  expect(await screen.findByText('CNA')).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(useUiStore.getState().toasts.map((t) => t.title)).toEqual(['Shift posted'])
  const post = fetchMock.mock.calls.find(([url, init]) => String(url) === '/api/shifts' && init?.method === 'POST')!
  expect(JSON.parse(String(post[1]?.body))).toEqual({
    role: 'CNA',
    date: '2026-10-05',
    startTime: '07:00',
    endTime: '19:00',
  })
})

it('offers a reason picker and a cancel button only on filled shifts, and reopens the shift', async () => {
  let shifts = [makeShift(), makeShift({ id: 'shift-2', role: 'LPN', status: 'filled', claimedBy: 'nurse-1' })]
  const fetchMock = stubApi({
    'GET /api/branches': () => json(200, { branches: [makeBranch()] }),
    'GET /api/agencies/agency-a/shifts': () => json(200, { agencyId: 'agency-a', shifts }),
    'POST /api/shifts/shift-2/cancel': () => {
      shifts = shifts.map((s) => (s.id === 'shift-2' ? { ...s, status: 'open', claimedBy: null } : s))
      return json(200, shifts[1])
    },
  })
  render()
  expect(await screen.findByText('LPN')).toBeTruthy()
  expect(screen.getAllByTestId('shift-cancel-button')).toHaveLength(1)
  const row = screen.getByText('LPN').closest('tr')!
  await userEvent.selectOptions(within(row).getByLabelText('Cancellation reason'), 'no-show')
  await userEvent.click(within(row).getByTestId('shift-cancel-button'))

  await vi.waitFor(() => expect(screen.queryByTestId('shift-cancel-button')).toBeNull())
  expect(JSON.parse(String(fetchMock.mock.calls.find(([url]) => String(url).endsWith('/cancel'))![1]?.body))).toEqual({
    reason: 'no-show',
  })
  expect(useUiStore.getState().toasts.map((t) => t.title)).toEqual(['Shift reopened'])
})

it('reads the agency’s own shifts and filters by status client-side', async () => {
  const fetchMock = stubApi({
    'GET /api/branches': () => json(200, { branches: [makeBranch()] }),
    'GET /api/agencies/agency-a/shifts': () =>
      json(200, {
        agencyId: 'agency-a',
        shifts: [makeShift(), makeShift({ id: 'shift-2', role: 'LPN', status: 'filled', claimedBy: 'nurse-1' })],
      }),
  })
  render()
  expect(await screen.findByText('LPN')).toBeTruthy()
  expect(screen.getAllByRole('row')).toHaveLength(3)

  await userEvent.selectOptions(screen.getByLabelText('Status'), 'filled')

  expect(window.location.search).toBe('?status=filled')
  expect(screen.getAllByRole('row')).toHaveLength(2)
  expect(screen.queryByText('RN')).toBeNull()
  expect(fetchMock.mock.calls.map(([url]) => String(url)).filter((u) => u.includes('/shifts'))).toEqual([
    '/api/agencies/agency-a/shifts',
  ])

  await userEvent.selectOptions(screen.getByLabelText('Status'), '')
  expect(window.location.search).toBe('')
})
