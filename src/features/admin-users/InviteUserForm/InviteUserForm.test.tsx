// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { AGENCY_ID, BRANCH_ID, json, makeAgency, makeBranch, stubApi } from '../../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../../tests/render-with-providers.tsx'
import { ApiError } from '../../../shared/api/client/index.ts'
import { InviteUserForm } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

const INACTIVE_AGENCY = 'a1000000-0000-4000-8000-000000000003'

function stubLookups() {
  return stubApi({
    'GET /api/admin/agencies': () =>
      json(200, {
        agencies: [makeAgency(), makeAgency({ id: INACTIVE_AGENCY, name: 'Lakeside Staffing', status: 'inactive' })],
      }),
    'GET /api/branches': () =>
      json(200, {
        branches: [
          makeBranch(),
          makeBranch({ id: 'b1000000-0000-4000-8000-000000000005', name: 'Lakeside Clinic', status: 'inactive' }),
        ],
      }),
  })
}

it('invites a nurse to one active branch', async () => {
  stubLookups()
  const onSubmit = vi.fn()
  renderWithProviders(<InviteUserForm pending={false} error={null} onSubmit={onSubmit} />)
  await userEvent.type(screen.getByLabelText('Full name'), ' New Nurse ')
  await userEvent.type(screen.getByLabelText('Email'), 'new@example.test')
  await waitFor(() =>
    expect(screen.getByRole('option', { name: 'Northwind Care Staffing · Downtown Clinic' })).toBeTruthy(),
  )
  expect(screen.queryByRole('option', { name: /Lakeside Clinic/ })).toBeNull()
  expect(screen.getByRole('button', { name: 'Send invitation' }).hasAttribute('disabled')).toBe(true)
  await userEvent.selectOptions(screen.getByLabelText('Branch'), BRANCH_ID)
  await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }))
  expect(onSubmit).toHaveBeenCalledWith({
    email: 'new@example.test',
    fullName: 'New Nurse',
    role: 'nurse',
    branchId: BRANCH_ID,
  })
})

it('invites an agency user to active agencies only, and an admin to nothing else', async () => {
  stubLookups()
  const onSubmit = vi.fn()
  renderWithProviders(<InviteUserForm pending={false} error={null} onSubmit={onSubmit} />)
  await userEvent.type(screen.getByLabelText('Full name'), 'Riley')
  await userEvent.type(screen.getByLabelText('Email'), 'riley@example.test')
  await userEvent.selectOptions(screen.getByLabelText('Role'), 'agency')
  await waitFor(() => expect(screen.getByRole('option', { name: 'Northwind Care Staffing' })).toBeTruthy())
  expect(screen.queryByRole('option', { name: 'Lakeside Staffing' })).toBeNull()
  await userEvent.selectOptions(screen.getByLabelText('Agencies'), [AGENCY_ID])
  await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }))
  expect(onSubmit).toHaveBeenLastCalledWith({
    email: 'riley@example.test',
    fullName: 'Riley',
    role: 'agency',
    agencyIds: [AGENCY_ID],
  })

  await userEvent.selectOptions(screen.getByLabelText('Role'), 'admin')
  expect(screen.queryByLabelText('Agencies')).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }))
  expect(onSubmit).toHaveBeenLastCalledWith({ email: 'riley@example.test', fullName: 'Riley', role: 'admin' })
})

it('shows email_exists on the email field and other failures as a notice', () => {
  stubLookups()
  const taken = new ApiError(409, 'email_exists', 'An account with this email already exists')
  const { rerender } = renderWithProviders(<InviteUserForm pending={false} error={taken} onSubmit={vi.fn()} />)
  expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe('true')
  expect(screen.getByRole('alert').textContent).toBe(taken.message)

  rerender(
    <InviteUserForm
      pending={false}
      error={new ApiError(503, 'auth_unavailable', 'Invitations are unavailable right now')}
      onSubmit={vi.fn()}
    />,
  )
  expect(screen.getByRole('alert').textContent).toContain('unavailable right now')
  expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBeNull()
})
