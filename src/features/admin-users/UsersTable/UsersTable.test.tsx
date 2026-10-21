// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { AGENCY_ID, makeAdminUser } from '../../../../tests/fake-api.ts'
import { UsersTable } from './index.ts'

it('shows role, status and access for each kind of user', () => {
  const { container } = render(
    <UsersTable
      users={[
        makeAdminUser(),
        makeAdminUser({ id: 'c1000000-0000-4000-8000-000000000002', fullName: 'Riley Northwind', email: 'riley@example.test', role: 'agency', agencies: [{ id: AGENCY_ID, name: 'Northwind Care Staffing' }], eligibleBranches: [] }),
        makeAdminUser({ id: 'c1000000-0000-4000-8000-000000000003', fullName: 'New Admin', email: 'admin2@example.test', role: 'admin', status: 'invited', lastSignInAt: null, eligibleBranches: [] }),
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
  expect(container.firstChild).toMatchSnapshot()
})
