// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { EligibilityToggle } from './index.ts'

const base = { nurseName: 'Ava Thompson', branchName: 'Downtown Clinic', disabled: false, pending: false }

it('offers to suspend an active nurse and to activate anyone else', async () => {
  const onChange = vi.fn()
  const { rerender } = render(<EligibilityToggle {...base} status="active" onChange={onChange} />)
  expect(screen.getByText('Active')).toBeTruthy()
  await userEvent.click(screen.getByRole('button', { name: 'Suspend Ava Thompson at Downtown Clinic' }))
  expect(onChange).toHaveBeenLastCalledWith('suspended')

  rerender(<EligibilityToggle {...base} status="suspended" onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: 'Activate Ava Thompson at Downtown Clinic' }))
  expect(onChange).toHaveBeenLastCalledWith('active')

  rerender(<EligibilityToggle {...base} status={null} onChange={onChange} />)
  expect(screen.getByText('Not eligible')).toBeTruthy()
  expect(screen.getByRole('button', { name: /Activate/ })).toBeTruthy()
})

it('is inert while disabled or pending', () => {
  const { rerender } = render(<EligibilityToggle {...base} status="pending" disabled onChange={vi.fn()} />)
  expect(screen.getByText('Pending')).toBeTruthy()
  expect(screen.getByRole('button').hasAttribute('disabled')).toBe(true)
  rerender(<EligibilityToggle {...base} status="pending" pending onChange={vi.fn()} />)
  expect(screen.getByRole('button', { name: /Activate/ }).textContent).toBe('Saving…')
})
