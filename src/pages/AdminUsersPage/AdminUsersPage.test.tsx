// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { ADMIN, BRANCH_ID, json, makeAdminUser, makeAgency, makeBranch, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { useUiStore } from '../../stores/ui-store/index.ts'
import { AdminUsersPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

const SELF = makeAdminUser({
  id: ADMIN.id,
  fullName: ADMIN.name,
  email: 'alex.kim@example.com',
  role: 'admin',
  eligibleBranches: [],
})
const lookups = {
  'GET /api/admin/agencies': () => json(200, { agencies: [makeAgency()] }),
  'GET /api/branches': () => json(200, { branches: [makeBranch()] }),
}
const render = () => renderWithProviders(<AdminUsersPage />, { path: '/admin/users', session: true, user: ADMIN })

it('lists users and invites a nurse from the modal, then refreshes the list', async () => {
  let users = [SELF, makeAdminUser()]
  const fetchMock = stubApi({
    ...lookups,
    'GET /api/admin/users': () => json(200, { users }),
    'POST /api/admin/users': () => {
      users = [
        ...users,
        makeAdminUser({
          id: 'c1000000-0000-4000-8000-000000000009',
          fullName: 'New Nurse',
          email: 'new@example.test',
          status: 'invited',
          lastSignInAt: null,
        }),
      ]
      return json(201, { user: users[2] })
    },
  })
  render()
  const table = await screen.findByTestId('users-table')
  expect(within(table).getAllByRole('row')).toHaveLength(3)
  expect(screen.queryByRole('dialog')).toBeNull()

  await userEvent.click(screen.getByRole('button', { name: 'Invite user' }))
  expect(screen.getByRole('dialog', { name: 'Invite a user' })).toBeTruthy()
  await userEvent.type(screen.getByLabelText('Full name'), 'New Nurse')
  await userEvent.type(screen.getByLabelText('Email'), 'new@example.test')
  await screen.findByRole('option', { name: /Downtown Clinic/ })
  await userEvent.selectOptions(screen.getByLabelText('Branch'), BRANCH_ID)
  await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }))

  expect(await screen.findByText('New Nurse')).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
  const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!
  expect(JSON.parse(String(post[1]?.body))).toEqual({
    email: 'new@example.test',
    fullName: 'New Nurse',
    role: 'nurse',
    branchId: BRANCH_ID,
  })
})

it('keeps the modal open and shows an existing email on the field', async () => {
  stubApi({
    ...lookups,
    'GET /api/admin/users': () => json(200, { users: [SELF] }),
    'POST /api/admin/users': () => json(409, { error: 'An account with this email already exists' }),
  })
  render()
  await screen.findByTestId('users-table')
  await userEvent.click(screen.getByRole('button', { name: 'Invite user' }))
  await userEvent.type(screen.getByLabelText('Full name'), 'Ava Again')
  await userEvent.type(screen.getByLabelText('Email'), 'ava@example.test')
  await userEvent.selectOptions(screen.getByLabelText('Role'), 'admin')
  await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }))
  expect((await screen.findByRole('alert')).textContent).toContain('already exists')
  expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe('true')
  expect(screen.getByRole('dialog', { name: 'Invite a user' })).toBeTruthy()
})

it('deletes a user after the warning, never offers to delete the viewer, and explains a refusal', async () => {
  const ava = makeAdminUser()
  const riley = makeAdminUser({
    id: 'c1000000-0000-4000-8000-000000000002',
    fullName: 'Riley Northwind',
    email: 'riley@example.test',
    role: 'agency',
    eligibleBranches: [],
  })
  let users = [SELF, ava, riley]
  stubApi({
    ...lookups,
    'GET /api/admin/users': () => json(200, { users }),
    [`DELETE /api/admin/users/${riley.id}`]: () => {
      users = [SELF, ava]
      return { status: 204 }
    },
    [`DELETE /api/admin/users/${ava.id}`]: () =>
      json(409, { error: 'This user has shifts or recorded actions and cannot be deleted' }),
  })
  render()
  await screen.findByTestId('users-table')
  expect(screen.queryByRole('button', { name: `Delete ${ADMIN.name}` })).toBeNull()

  await userEvent.click(screen.getByRole('button', { name: 'Delete Riley Northwind' }))
  const dialog = screen.getByRole('dialog', { name: 'Delete Riley Northwind?' })
  expect(dialog.textContent).toContain('riley@example.test')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Delete user' }))
  await vi.waitFor(() => expect(screen.queryByText('Riley Northwind')).toBeNull())
  expect(useUiStore.getState().toasts.map((t) => t.title)).toEqual(['User deleted'])

  await userEvent.click(screen.getByRole('button', { name: 'Delete Ava Thompson' }))
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete user' }))
  await vi.waitFor(() => expect(useUiStore.getState().toasts.map((t) => t.title)).toContain('User not deleted'))
  expect(screen.getByText('Ava Thompson')).toBeTruthy()
})

it('shows the empty state when nobody exists yet', async () => {
  stubApi({ ...lookups, 'GET /api/admin/users': () => json(200, { users: [] }) })
  render()
  expect(await screen.findByText('No users yet')).toBeTruthy()
})
