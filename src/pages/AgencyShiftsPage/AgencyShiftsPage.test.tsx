// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { AGENCY, json, makeBranch, makeShift, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { AgencyShiftsPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

const render = () => renderWithProviders(<AgencyShiftsPage />, { path: '/agency/shifts', session: true, user: AGENCY })

it('shows the agency page with the post form and no shifts', async () => {
  stubApi({
    'GET /api/branches': () => json(200, { branches: [makeBranch()] }),
    'GET /api/agencies/agency-a/shifts': () => json(200, { agencyId: 'agency-a', shifts: [] }),
  })
  const { container } = render()
  await screen.findByText('No shifts match')
  expect(screen.getByRole('button', { name: 'Post shift' })).toBeTruthy()
  expect(container.firstChild).toMatchSnapshot()
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
