// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { BRANCH_ID, json, makeAdminUser, makeAgency, makeBranch, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { AdminUsersPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

const lookups = {
  'GET /api/admin/agencies': () => json(200, { agencies: [makeAgency()] }),
  'GET /api/branches': () => json(200, { branches: [makeBranch()] }),
}

it('lists users and invites a nurse, then refreshes the list', async () => {
  let users = [makeAdminUser()]
  const fetchMock = stubApi({
    ...lookups,
    'GET /api/admin/users': () => json(200, { users }),
    'POST /api/admin/users': () => {
      users = [...users, makeAdminUser({ id: 'c1000000-0000-4000-8000-000000000009', fullName: 'New Nurse', email: 'new@example.test', status: 'invited', lastSignInAt: null })]
      return json(201, { user: users[1] })
    },
  })
  renderWithProviders(<AdminUsersPage />, { path: '/admin/users' })
  const table = await screen.findByTestId('users-table')
  expect(within(table).getAllByRole('row')).toHaveLength(2)

  await userEvent.type(screen.getByLabelText('Full name'), 'New Nurse')
  await userEvent.type(screen.getByLabelText('Email'), 'new@example.test')
  await screen.findByRole('option', { name: /Downtown Clinic/ })
  await userEvent.selectOptions(screen.getByLabelText('Branch'), BRANCH_ID)
  await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }))

  expect(await screen.findByText('New Nurse')).toBeTruthy()
  const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!
  expect(JSON.parse(String(post[1]?.body))).toEqual({ email: 'new@example.test', fullName: 'New Nurse', role: 'nurse', branchId: BRANCH_ID })
  expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('')
})

it('shows an existing email on the field', async () => {
  stubApi({
    ...lookups,
    'GET /api/admin/users': () => json(200, { users: [makeAdminUser()] }),
    'POST /api/admin/users': () => json(409, { error: { code: 'email_exists', message: 'An account with this email already exists' } }),
  })
  renderWithProviders(<AdminUsersPage />, { path: '/admin/users' })
  await screen.findByTestId('users-table')
  await userEvent.type(screen.getByLabelText('Full name'), 'Ava Again')
  await userEvent.type(screen.getByLabelText('Email'), 'ava@example.test')
  await userEvent.selectOptions(screen.getByLabelText('Role'), 'admin')
  await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }))
  expect((await screen.findByRole('alert')).textContent).toContain('already exists')
  expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe('true')
})

it('shows the empty state when nobody exists yet', async () => {
  stubApi({ ...lookups, 'GET /api/admin/users': () => json(200, { users: [] }) })
  renderWithProviders(<AdminUsersPage />, { path: '/admin/users' })
  expect(await screen.findByText('No users yet')).toBeTruthy()
})
