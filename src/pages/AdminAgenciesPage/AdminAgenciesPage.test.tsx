// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { AGENCY_ID, json, makeAgency, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { useUiStore } from '../../stores/ui-store/index.ts'
import { AdminAgenciesPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('shows the empty state and opens the create modal', async () => {
  stubApi({ 'GET /api/admin/agencies': () => json(200, { agencies: [] }) })
  const { container } = renderWithProviders(<AdminAgenciesPage />, { path: '/admin/agencies' })
  await screen.findByText('No agencies yet')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(container.firstChild).toMatchSnapshot()
  await userEvent.click(screen.getByRole('button', { name: 'New agency' }))
  expect(screen.getByRole('dialog', { name: 'New agency' })).toBeTruthy()
  expect(document.activeElement).toBe(screen.getByLabelText('Name'))
  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).toBeNull()
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

it('creates an agency from the modal, closes it and refreshes the list', async () => {
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
  await userEvent.click(screen.getByRole('button', { name: 'New agency' }))
  await userEvent.type(screen.getByLabelText('Name'), 'Summit Nursing')
  await userEvent.click(screen.getByRole('button', { name: 'Create agency' }))
  expect(await screen.findByRole('link', { name: 'Summit Nursing' })).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(JSON.parse(String(fetchMock.mock.calls[1]![1]?.body))).toEqual({ name: 'Summit Nursing' })
})

it('keeps the modal open and shows a taken name on the field', async () => {
  stubApi({
    'GET /api/admin/agencies': () => json(200, { agencies: [makeAgency()] }),
    'POST /api/admin/agencies': () => json(409, { error: { code: 'name_taken', message: 'An agency with this name already exists' } }),
  })
  renderWithProviders(<AdminAgenciesPage />, { path: '/admin/agencies' })
  await screen.findByTestId('agencies-table')
  await userEvent.click(screen.getByRole('button', { name: 'New agency' }))
  await userEvent.type(screen.getByLabelText('Name'), 'Northwind Care Staffing')
  await userEvent.click(screen.getByRole('button', { name: 'Create agency' }))
  expect((await screen.findByRole('alert')).textContent).toContain('already exists')
  expect(screen.getByRole('dialog', { name: 'New agency' })).toBeTruthy()
})

it('deletes an agency after the warning, and explains a refusal', async () => {
  let agencies = [makeAgency(), makeAgency({ id: 'a1000000-0000-4000-8000-000000000003', name: 'Lakeside Staffing', branchCount: 0 })]
  stubApi({
    'GET /api/admin/agencies': () => json(200, { agencies }),
    [`DELETE /api/admin/agencies/${AGENCY_ID}`]: () => json(409, { error: { code: 'agency_has_shifts', message: 'This agency has shifts and cannot be deleted; deactivate it instead' } }),
    'DELETE /api/admin/agencies/a1000000-0000-4000-8000-000000000003': () => {
      agencies = agencies.slice(0, 1)
      return { status: 204 }
    },
  })
  renderWithProviders(<AdminAgenciesPage />, { path: '/admin/agencies' })
  await screen.findByTestId('agencies-table')

  await userEvent.click(screen.getByRole('button', { name: 'Delete Lakeside Staffing' }))
  const dialog = screen.getByRole('dialog', { name: 'Delete Lakeside Staffing?' })
  expect(dialog.textContent).toContain('cannot be undone')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Delete agency' }))
  await vi.waitFor(() => expect(screen.queryByRole('link', { name: 'Lakeside Staffing' })).toBeNull())
  expect(useUiStore.getState().toasts.map((t) => t.title)).toEqual(['Agency deleted'])

  await userEvent.click(screen.getByRole('button', { name: 'Delete Northwind Care Staffing' }))
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete agency' }))
  await vi.waitFor(() => expect(useUiStore.getState().toasts.map((t) => t.title)).toContain('Agency not deleted'))
  expect(screen.getByRole('link', { name: 'Northwind Care Staffing' })).toBeTruthy()
})
