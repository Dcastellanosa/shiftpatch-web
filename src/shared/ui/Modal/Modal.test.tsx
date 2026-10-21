// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { Modal } from './index.ts'

it('labels the dialog, focuses the first field, and closes on Escape, the close button and the backdrop', async () => {
  const onClose = vi.fn()
  const { container } = render(
    <Modal title="New agency" description="Agencies group branches." onClose={onClose}>
      <label>
        Name <input name="name" />
      </label>
    </Modal>,
  )
  const dialog = screen.getByRole('dialog', { name: 'New agency' })
  expect(dialog.getAttribute('aria-modal')).toBe('true')
  expect(dialog.getAttribute('aria-describedby')).toBeTruthy()
  expect(document.activeElement).toBe(screen.getByLabelText('Name'))
  expect(container.firstChild).toMatchSnapshot()

  await userEvent.keyboard('{Escape}')
  await userEvent.click(screen.getByRole('button', { name: 'Close' }))
  await userEvent.click(container.firstChild as HTMLElement)
  expect(onClose).toHaveBeenCalledTimes(3)
})
