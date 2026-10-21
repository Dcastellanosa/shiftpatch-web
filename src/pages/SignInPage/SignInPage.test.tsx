// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { SessionContext } from '../../auth/session-context/index.ts'
import { SignInPage } from './index.ts'

it('renders the sign-in form and delegates credentials to the session', async () => {
  const login = vi.fn(async () => {})
  const { container } = render(
    <SessionContext value={{ loading: false, authenticated: false, user: null, error: null, login, logout: vi.fn(async () => {}) }}>
      <SignInPage />
    </SessionContext>,
  )
  expect(container.firstChild).toMatchSnapshot()
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nurse@example.test' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'example-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
  await vi.waitFor(() => expect(login).toHaveBeenCalledWith('nurse@example.test', 'example-password'))
})
