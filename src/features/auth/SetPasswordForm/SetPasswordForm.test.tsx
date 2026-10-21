// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api/client/index.ts'
import { SetPasswordForm } from './index.ts'

it('requires a matching password of at least eight characters and submits only the password', async () => {
  const onSubmit = vi.fn()
  const { container } = render(<SetPasswordForm type="invite" pending={false} error={null} onSubmit={onSubmit} />)
  expect(container.firstChild).toMatchSnapshot()
  const button = screen.getByRole('button', { name: 'Set password and sign in' })
  await userEvent.type(screen.getByLabelText('Password'), 'short')
  await userEvent.type(screen.getByLabelText('Confirm password'), 'short')
  expect(button.hasAttribute('disabled')).toBe(true)

  await userEvent.clear(screen.getByLabelText('Password'))
  await userEvent.type(screen.getByLabelText('Password'), 'correct horse battery')
  expect(screen.getByText('The passwords do not match.')).toBeTruthy()
  await userEvent.clear(screen.getByLabelText('Confirm password'))
  await userEvent.type(screen.getByLabelText('Confirm password'), 'correct horse battery')
  await userEvent.click(button)
  expect(onSubmit).toHaveBeenCalledWith('correct horse battery')
})

it('shows a weak password on the field and an expired link as a notice', () => {
  const { rerender } = render(<SetPasswordForm type="recovery" pending={false} error={new ApiError(422, 'weak_password', 'Choose a longer, less common password')} onSubmit={vi.fn()} />)
  expect(screen.getByLabelText('New password').getAttribute('aria-invalid')).toBe('true')
  expect(screen.getByRole('alert').textContent).toContain('less common')

  rerender(<SetPasswordForm type="recovery" pending={false} error={new ApiError(401, 'invalid_or_expired_link', 'This link is invalid or has expired. Request a new one.')} onSubmit={vi.fn()} />)
  expect(screen.getByRole('alert').textContent).toContain('no longer works')
  expect(screen.getByRole('button', { name: 'Save new password' })).toBeTruthy()
})
