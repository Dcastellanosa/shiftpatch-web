// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { AGENCY_ID, makeAdminUser } from '../../../../tests/fake-api.ts'
import { UsersTable } from './index.ts'

const SELF = 'c1000000-0000-4000-8000-000000000003'

it('shows role, status and access for each kind of user, with delete for everyone but the viewer', async () => {
  const onDelete = vi.fn()
  const { container } = render(
    <UsersTable
      currentUserId={SELF}
      pendingUserId={null}
      onDelete={onDelete}
      users={[
        makeAdminUser(),
        makeAdminUser({
          id: 'c1000000-0000-4000-8000-000000000002',
          fullName: 'Riley Northwind',
          email: 'riley@example.test',
          role: 'agency',
          agencies: [{ id: AGENCY_ID, name: 'Northwind Care Staffing' }],
          eligibleBranches: [],
        }),
        makeAdminUser({
          id: SELF,
          fullName: 'New Admin',
          email: 'admin2@example.test',
          role: 'admin',
          status: 'invited',
          lastSignInAt: null,
          eligibleBranches: [],
        }),
      ]}
    />,
  )
  const rows = within(screen.getByTestId('users-table')).getAllByRole('row').slice(1)
  expect(rows).toHaveLength(3)
  expect(within(rows[0]!).getByText('Northwind Care Staffing · Downtown Clinic', { exact: false })).toBeTruthy()
  expect(within(rows[1]!).getByText('Northwind Care Staffing')).toBeTruthy()
  expect(within(rows[2]!).getByText('Invited')).toBeTruthy()
  expect(within(rows[2]!).getByText('All agencies')).toBeTruthy()
  expect(within(rows[2]!).getByText(/^Invited /)).toBeTruthy()
  expect(within(rows[2]!).queryByRole('button', { name: /^Delete/ })).toBeNull()
  expect(container.firstChild).toMatchSnapshot()

  await userEvent.click(within(rows[0]!).getByRole('button', { name: 'Delete Ava Thompson' }))
  expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Ava Thompson' }))
})

it('marks the row being deleted and disables the other delete buttons meanwhile', () => {
  render(
    <UsersTable
      currentUserId={SELF}
      pendingUserId={makeAdminUser().id}
      onDelete={vi.fn()}
      users={[
        makeAdminUser(),
        makeAdminUser({
          id: 'c1000000-0000-4000-8000-000000000002',
          fullName: 'Riley Northwind',
          role: 'agency',
          eligibleBranches: [],
        }),
      ]}
    />,
  )
  expect(screen.getByRole('button', { name: 'Delete Ava Thompson' }).textContent).toBe('Deleting…')
  expect(screen.getByRole('button', { name: 'Delete Riley Northwind' }).hasAttribute('disabled')).toBe(true)
})
