// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeAgency, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { AdminAgenciesPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('shows the empty state and the create form', async () => {
  stubApi({ 'GET /api/admin/agencies': () => json(200, { agencies: [] }) })
  const { container } = renderWithProviders(<AdminAgenciesPage />, { path: '/admin/agencies' })
  await screen.findByText('No agencies yet')
  expect(container.firstChild).toMatchSnapshot()
})

it('lists agencies with status, branch count and a link to the detail page', async () => {
  stubApi({
    'GET /api/admin/agencies': () =>
      json(200, { agencies: [makeAgency(), makeAgency({ id: 'a1000000-0000-4000-8000-000000000003', name: 'Lakeside Staffing', status: 'inactive', branchCount: 1 })] }),
  })
  renderWithProviders(<AdminAgenciesPage />, { path: '/admin/agencies' })
  const table = await screen.findByTestId('agencies-table')
  const rows = within(table).getAllByRole('row').slice(1)
  expect(rows).toHaveLength(2)
  expect(within(rows[0]!).getByRole('link', { name: 'Northwind Care Staffing' }).getAttribute('href')).toBe('/admin/agencies/a1000000-0000-4000-8000-000000000001')
  expect(within(rows[1]!).getByText('Inactive')).toBeTruthy()
  expect(within(rows[1]!).getByText('1')).toBeTruthy()
})

it('creates an agency and refreshes the list', async () => {
  let agencies = [] as ReturnType<typeof makeAgency>[]
  const fetchMock = stubApi({
    'GET /api/admin/agencies': () => json(200, { agencies }),
    'POST /api/admin/agencies': () => {
      agencies = [makeAgency({ name: 'Summit Nursing', branchCount: 0 })]
      return json(201, { agency: agencies[0] })
    },
  })
  renderWithProviders(<AdminAgenciesPage />, { path: '/admin/agencies' })
  await screen.findByText('No agencies yet')
  await userEvent.type(screen.getByLabelText('Name'), 'Summit Nursing')
  await userEvent.click(screen.getByRole('button', { name: 'Create agency' }))
  expect(await screen.findByRole('link', { name: 'Summit Nursing' })).toBeTruthy()
  expect(JSON.parse(String(fetchMock.mock.calls[1]![1]?.body))).toEqual({ name: 'Summit Nursing' })
  expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('')
})

it('shows a taken name on the field', async () => {
  stubApi({
    'GET /api/admin/agencies': () => json(200, { agencies: [makeAgency()] }),
    'POST /api/admin/agencies': () => json(409, { error: { code: 'name_taken', message: 'An agency with this name already exists' } }),
  })
  renderWithProviders(<AdminAgenciesPage />, { path: '/admin/agencies' })
  await screen.findByTestId('agencies-table')
  await userEvent.type(screen.getByLabelText('Name'), 'Northwind Care Staffing')
  await userEvent.click(screen.getByRole('button', { name: 'Create agency' }))
  expect((await screen.findByRole('alert')).textContent).toContain('already exists')
})
