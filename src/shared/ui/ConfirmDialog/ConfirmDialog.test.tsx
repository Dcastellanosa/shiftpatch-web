// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ConfirmDialog } from './index.ts'

it('focuses the confirm button, confirms, and cancels on Escape', async () => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  const { container } = render(
    <ConfirmDialog title="Deactivate Downtown Clinic?" confirmLabel="Deactivate" destructive onConfirm={onConfirm} onCancel={onCancel}>
      Nurses will no longer see its shifts.
    </ConfirmDialog>,
  )
  const dialog = screen.getByRole('dialog', { name: 'Deactivate Downtown Clinic?' })
  expect(dialog.getAttribute('aria-modal')).toBe('true')
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Deactivate' }))
  expect(container.firstChild).toMatchSnapshot()

  await userEvent.keyboard('{Enter}')
  expect(onConfirm).toHaveBeenCalledTimes(1)
  await userEvent.keyboard('{Escape}')
  expect(onCancel).toHaveBeenCalledTimes(1)
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(onCancel).toHaveBeenCalledTimes(2)
})

it('ignores cancel and confirm while pending', async () => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <ConfirmDialog title="Activate?" confirmLabel="Activate" pending onConfirm={onConfirm} onCancel={onCancel}>
      body
    </ConfirmDialog>,
  )
  expect(screen.getByRole('button', { name: 'Saving…' }).hasAttribute('disabled')).toBe(true)
  await userEvent.keyboard('{Escape}')
  expect(onCancel).not.toHaveBeenCalled()
})
