// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { StatusToggle } from './index.ts'

it('asks for confirmation before deactivating and reports the next status', async () => {
  const onChange = vi.fn()
  render(<StatusToggle kind="branch" name="Downtown Clinic" status="active" pending={false} onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: 'Deactivate' }))
  const dialog = screen.getByRole('dialog', { name: 'Deactivate Downtown Clinic?' })
  expect(dialog.textContent).toContain('no longer see its open shifts')
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(onChange).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole('button', { name: 'Deactivate' }))
  await userEvent.keyboard('{Enter}')
  expect(onChange).toHaveBeenCalledWith('inactive')
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('activates an inactive agency after confirmation', async () => {
  const onChange = vi.fn()
  render(<StatusToggle kind="agency" name="Lakeside" status="inactive" pending={false} onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: 'Activate' }))
  await userEvent.click(screen.getByRole('dialog').querySelector('.btn--primary')!)
  expect(onChange).toHaveBeenCalledWith('active')
})
