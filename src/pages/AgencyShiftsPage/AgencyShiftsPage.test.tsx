// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { json, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { AgencyShiftsPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('shows the agency page without branches or shifts', async () => {
  stubApi({
    'GET /api/branches': () => json(200, { branches: [] }),
    'GET /api/shifts': () => json(200, { shifts: [] }),
  })
  const { container } = renderWithProviders(<AgencyShiftsPage />, { path: '/agency/shifts' })
  await screen.findByText('No branches yet')
  await screen.findByText('No shifts match')
  expect(container.firstChild).toMatchSnapshot()
})

it('keeps the status filter in the URL and sends it to the API', async () => {
  const fetchMock = stubApi({
    'GET /api/branches': () => json(200, { branches: [] }),
    'GET /api/shifts': () => json(200, { shifts: [] }),
  })
  renderWithProviders(<AgencyShiftsPage />, { path: '/agency/shifts' })
  await screen.findByText('No shifts match')

  await userEvent.selectOptions(screen.getByLabelText('Status'), 'claimed')

  expect(window.location.search).toBe('?status=claimed')
  await vi.waitFor(() =>
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toContain('/api/shifts?status=claimed'),
  )

  await userEvent.selectOptions(screen.getByLabelText('Status'), '')
  expect(window.location.search).toBe('')
})
