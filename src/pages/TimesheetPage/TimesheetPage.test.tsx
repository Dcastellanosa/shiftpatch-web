// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeTimesheet, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { TimesheetPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('shows the timesheet table with nurse, agency, date, times, hours and status', async () => {
  stubApi({ 'GET /api/timesheets': () => json(200, { timesheets: [makeTimesheet()] }) })
  const { container } = renderWithProviders(<TimesheetPage />, { path: '/timesheets' })
  const table = await screen.findByTestId('timesheet-table')
  const row = within(table).getAllByRole('row')[1]!
  expect(row.textContent).toContain('Maria Lopez')
  expect(row.textContent).toContain('Sunrise Health Staffing')
  expect(row.textContent).toContain('Sat, Oct 3, 2026')
  expect(row.textContent).toContain('07:00 – 19:00')
  expect(row.textContent).toContain('12')
  expect(row.textContent).toContain('Worked')
  expect(container.firstChild).toMatchSnapshot()
})

it('shows an empty state and an error state with retry', async () => {
  stubApi({ 'GET /api/timesheets': () => json(200, { timesheets: [] }) })
  const { unmount } = renderWithProviders(<TimesheetPage />, { path: '/timesheets' })
  expect(await screen.findByText('No timesheet entries yet')).toBeTruthy()
  unmount()

  stubApi({ 'GET /api/timesheets': () => json(503, { error: 'Data service is not available' }) })
  renderWithProviders(<TimesheetPage />, { path: '/timesheets' })
  expect(await screen.findByText('Something went wrong')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Try Again' })).toBeTruthy()
})
