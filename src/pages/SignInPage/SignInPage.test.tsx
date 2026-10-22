// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { createTestQueryClient } from '../../../tests/render-with-providers.tsx'
import { SessionContext } from '../../features/auth/session-context/index.ts'
import { SignInPage } from './index.ts'

it('renders the sign-in form and delegates credentials to the session', async () => {
  const login = vi.fn(async () => {})
  const { container } = render(
    <SessionContext
      value={{ loading: false, authenticated: false, user: null, error: null, login, logout: vi.fn(async () => {}) }}
    >
      <SignInPage />
    </SessionContext>,
  )
  expect(container.firstChild).toMatchSnapshot()
  expect(screen.getByTestId('login-email-input')).toBe(screen.getByLabelText('Email'))
  expect(screen.getByTestId('login-password-input')).toBe(screen.getByLabelText('Password'))
  expect(screen.getByTestId('login-submit-button')).toBe(screen.getByRole('button', { name: 'Sign In' }))
  fireEvent.change(screen.getByTestId('login-email-input'), { target: { value: 'nurse@example.test' } })
  fireEvent.change(screen.getByTestId('login-password-input'), { target: { value: 'example-password' } })
  fireEvent.click(screen.getByTestId('login-submit-button'))
  await vi.waitFor(() => expect(login).toHaveBeenCalledWith('nurse@example.test', 'example-password'))
})

it('switches to the recovery form and back', async () => {
  render(
    <SessionContext
      value={{
        loading: false,
        authenticated: false,
        user: null,
        error: null,
        login: vi.fn(async () => {}),
        logout: vi.fn(async () => {}),
      }}
    >
      <QueryClientProvider client={createTestQueryClient()}>
        <SignInPage />
      </QueryClientProvider>
    </SessionContext>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Forgot your password?' }))
  expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Email me a link' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Back to sign in' }))
  expect(screen.getByRole('heading', { name: 'Sign In' })).toBeTruthy()
})
