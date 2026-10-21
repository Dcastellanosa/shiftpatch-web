// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api/client/index.ts'
import { AgencyForm } from './index.ts'

it('submits the trimmed name and disables the button until something changed', async () => {
  const onSubmit = vi.fn()
  const { container } = render(<AgencyForm pending={false} error={null} submitLabel="Create agency" onSubmit={onSubmit} />)
  expect(container.firstChild).toMatchSnapshot()
  const button = screen.getByRole('button', { name: 'Create agency' })
  expect(button.hasAttribute('disabled')).toBe(true)
  await userEvent.type(screen.getByLabelText('Name'), '  Summit Nursing  ')
  await userEvent.click(button)
  expect(onSubmit).toHaveBeenCalledWith({ name: 'Summit Nursing' })
})

it('shows a taken name on the field and other failures as a notice', () => {
  const taken = new ApiError(409, 'name_taken', 'An agency with this name already exists')
  const { rerender } = render(<AgencyForm initialName="Northwind" pending={false} error={taken} submitLabel="Save" onSubmit={vi.fn()} />)
  const input = screen.getByLabelText('Name')
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(screen.getByRole('alert').textContent).toBe(taken.message)

  rerender(<AgencyForm initialName="Northwind" pending={false} error={new ApiError(0, 'network_error', 'x')} submitLabel="Save" onSubmit={vi.fn()} />)
  expect(screen.getByRole('alert').textContent).toContain('could not be reached')
  expect(input.getAttribute('aria-invalid')).toBeNull()
})
