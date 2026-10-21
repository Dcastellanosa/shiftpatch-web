// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { makeAgencyBranch } from '../../../../tests/fake-api.ts'
import { ApiError } from '../../../shared/api/client/index.ts'
import { BranchForm } from './index.ts'

it('submits trimmed fields with the chosen time zone', async () => {
  const onSubmit = vi.fn()
  render(<BranchForm pending={false} error={null} submitLabel="Create branch" onSubmit={onSubmit} />)
  await userEvent.type(screen.getByLabelText('Branch name'), ' Uptown Clinic ')
  await userEvent.type(screen.getByLabelText('Address'), ' 1 Up Street ')
  await userEvent.selectOptions(screen.getByLabelText('Time zone'), 'America/Chicago')
  await userEvent.click(screen.getByRole('button', { name: 'Create branch' }))
  expect(onSubmit).toHaveBeenCalledWith({ name: 'Uptown Clinic', address: '1 Up Street', timezone: 'America/Chicago' })
})

it('starts from the branch being edited, disables saving until something changes, and cancels', async () => {
  const onSubmit = vi.fn()
  const onCancel = vi.fn()
  const branch = makeAgencyBranch()
  render(<BranchForm initial={branch} pending={false} error={null} submitLabel="Save branch" onSubmit={onSubmit} onCancel={onCancel} />)
  expect(screen.getByRole('heading', { name: `Edit ${branch.name}` })).toBeTruthy()
  expect((screen.getByLabelText('Time zone') as HTMLSelectElement).value).toBe(branch.timezone)
  expect(screen.getByRole('button', { name: 'Save branch' }).hasAttribute('disabled')).toBe(true)
  await userEvent.type(screen.getByLabelText('Address'), ' Suite 2')
  await userEvent.click(screen.getByRole('button', { name: 'Save branch' }))
  expect(onSubmit).toHaveBeenCalledWith({ name: branch.name, address: `${branch.address} Suite 2`, timezone: branch.timezone })
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(onCancel).toHaveBeenCalled()
})

it('shows a taken name on the field', () => {
  render(<BranchForm pending={false} error={new ApiError(409, 'name_taken', 'A branch of this agency with this name already exists')} submitLabel="Create branch" onSubmit={vi.fn()} />)
  expect(screen.getByLabelText('Branch name').getAttribute('aria-invalid')).toBe('true')
  expect(screen.getByRole('alert').textContent).toContain('already exists')
})
