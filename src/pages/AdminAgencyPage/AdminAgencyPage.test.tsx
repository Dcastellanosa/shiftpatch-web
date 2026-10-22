// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router'
import { AGENCY_ID, BRANCH_ID, json, makeAgency, makeAgencyBranch, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { AdminAgencyPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

const routed = () => (
  <Routes>
    <Route path="/admin/agencies/:agencyId" element={<AdminAgencyPage />} />
  </Routes>
)

it('shows the agency, its status and its branches', async () => {
  stubApi({
    [`GET /api/admin/agencies/${AGENCY_ID}`]: () =>
      json(200, {
        agency: makeAgency(),
        branches: [
          makeAgencyBranch(),
          makeAgencyBranch({
            id: 'b1000000-0000-4000-8000-000000000002',
            name: 'Riverside Hospital',
            status: 'inactive',
          }),
        ],
      }),
  })
  renderWithProviders(routed(), { path: `/admin/agencies/${AGENCY_ID}` })
  expect(await screen.findByRole('heading', { level: 1, name: 'Northwind Care Staffing' })).toBeTruthy()
  const rows = within(screen.getByTestId('branches-table')).getAllByRole('row').slice(1)
  expect(rows).toHaveLength(2)
  expect(within(rows[1]!).getByText('Inactive')).toBeTruthy()
  expect(within(rows[1]!).getByRole('button', { name: 'Activate' })).toBeTruthy()
  expect(screen.getByRole('link', { name: '← All agencies' }).getAttribute('href')).toBe('/admin/agencies')
  expect(screen.getByTestId('branches-table')).toMatchSnapshot()
})

it('deactivates a branch after confirmation and refreshes the detail', async () => {
  let branch = makeAgencyBranch()
  const fetchMock = stubApi({
    [`GET /api/admin/agencies/${AGENCY_ID}`]: () => json(200, { agency: makeAgency(), branches: [branch] }),
    [`PATCH /api/admin/agencies/${AGENCY_ID}/branches/${BRANCH_ID}`]: () => {
      branch = makeAgencyBranch({ status: 'inactive' })
      return json(200, { branch })
    },
  })
  renderWithProviders(routed(), { path: `/admin/agencies/${AGENCY_ID}` })
  const table = await screen.findByTestId('branches-table')
  await userEvent.click(within(table).getByRole('button', { name: 'Deactivate' }))
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Deactivate' }))
  expect(await within(table).findByRole('button', { name: 'Activate' })).toBeTruthy()
  expect(JSON.parse(String(fetchMock.mock.calls[1]![1]?.body))).toEqual({ status: 'inactive' })
})

it('creates a branch and edits one inline', async () => {
  let branches = [makeAgencyBranch()]
  const fetchMock = stubApi({
    [`GET /api/admin/agencies/${AGENCY_ID}`]: () => json(200, { agency: makeAgency(), branches }),
    [`POST /api/admin/agencies/${AGENCY_ID}/branches`]: () => {
      branches = [
        ...branches,
        makeAgencyBranch({ id: 'b1000000-0000-4000-8000-000000000009', name: 'Uptown Clinic', address: '1 Up Street' }),
      ]
      return json(201, { branch: branches[1] })
    },
    [`PATCH /api/admin/agencies/${AGENCY_ID}/branches/${BRANCH_ID}`]: () => {
      branches = branches.map((b) => (b.id === BRANCH_ID ? { ...b, address: '120 Main Street Suite 2' } : b))
      return json(200, { branch: branches[0] })
    },
  })
  renderWithProviders(routed(), { path: `/admin/agencies/${AGENCY_ID}` })
  await screen.findByTestId('branches-table')

  await userEvent.type(screen.getByLabelText('Branch name'), 'Uptown Clinic')
  await userEvent.type(screen.getByLabelText('Address'), '1 Up Street')
  await userEvent.click(screen.getByRole('button', { name: 'Create branch' }))
  expect(await screen.findByText('Uptown Clinic')).toBeTruthy()
  expect(JSON.parse(String(fetchMock.mock.calls[1]![1]?.body))).toMatchObject({
    name: 'Uptown Clinic',
    address: '1 Up Street',
  })

  await userEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]!)
  const form = screen.getByRole('form', { name: 'Edit Downtown Clinic' })
  await userEvent.type(within(form).getByLabelText('Address'), ' Suite 2')
  await userEvent.click(within(form).getByRole('button', { name: 'Save branch' }))
  expect(await screen.findByText('120 Main Street Suite 2')).toBeTruthy()
  expect(screen.queryByRole('form', { name: 'Edit Downtown Clinic' })).toBeNull()
})

it('explains an inactive agency and hides the branch form', async () => {
  stubApi({
    [`GET /api/admin/agencies/${AGENCY_ID}`]: () =>
      json(200, { agency: makeAgency({ status: 'inactive' }), branches: [] }),
  })
  renderWithProviders(routed(), { path: `/admin/agencies/${AGENCY_ID}` })
  expect(await screen.findByText('This agency is inactive')).toBeTruthy()
  expect(screen.queryByLabelText('Branch name')).toBeNull()
  expect(screen.getByRole('button', { name: 'Activate' })).toBeTruthy()
})

it('shows an error state with retry when the agency cannot be loaded', async () => {
  stubApi({
    [`GET /api/admin/agencies/${AGENCY_ID}`]: () => json(404, { error: 'Agency not found' }),
  })
  renderWithProviders(routed(), { path: `/admin/agencies/${AGENCY_ID}` })
  expect(await screen.findByText('Something went wrong')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Try Again' })).toBeTruthy()
})

it('deletes the agency after the warning and returns to the list', async () => {
  const fetchMock = stubApi({
    [`GET /api/admin/agencies/${AGENCY_ID}`]: () => json(200, { agency: makeAgency(), branches: [] }),
    [`DELETE /api/admin/agencies/${AGENCY_ID}`]: () => ({ status: 204 }),
  })
  renderWithProviders(
    <Routes>
      <Route path="/admin/agencies" element={<p>list screen</p>} />
      <Route path="/admin/agencies/:agencyId" element={<AdminAgencyPage />} />
    </Routes>,
    { path: `/admin/agencies/${AGENCY_ID}` },
  )
  await screen.findByRole('heading', { level: 1, name: 'Northwind Care Staffing' })
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
  const dialog = screen.getByRole('dialog', { name: 'Delete Northwind Care Staffing?' })
  await userEvent.click(within(dialog).getByRole('button', { name: 'Delete agency' }))
  expect(await screen.findByText('list screen')).toBeTruthy()
  expect(
    fetchMock.mock.calls.some(
      ([url, init]) => String(url) === `/api/admin/agencies/${AGENCY_ID}` && init?.method === 'DELETE',
    ),
  ).toBe(true)
})
