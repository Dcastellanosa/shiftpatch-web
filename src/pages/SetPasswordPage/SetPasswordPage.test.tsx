// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { NURSE, json, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { SESSION_QUERY_KEY } from '../../features/auth/use-session-query/index.ts'
import { SetPasswordPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

const TOKEN = 'pkce_0123456789abcdef'

it('posts the token from the fragment once, clears it from the URL, stores the session and goes home', async () => {
  const fetchMock = stubApi({ 'POST /api/auth/complete-password': () => json(200, { user: NURSE }) })
  const { queryClient, container } = renderWithProviders(<SetPasswordPage />, {
    path: `/set-password#token_hash=${TOKEN}&type=invite`,
  })
  expect(window.location.hash).toBe('')
  expect(window.location.pathname).toBe('/set-password')
  expect(screen.getByRole('heading', { level: 1, name: 'Welcome to ShiftPatch' })).toBeTruthy()
  expect(container.innerHTML).not.toContain(TOKEN)

  await userEvent.type(screen.getByLabelText('Password'), 'correct horse battery')
  await userEvent.type(screen.getByLabelText('Confirm password'), 'correct horse battery')
  await userEvent.click(screen.getByRole('button', { name: 'Set password and sign in' }))

  await vi.waitFor(() => expect(window.location.pathname).toBe('/'))
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({
    tokenHash: TOKEN,
    type: 'invite',
    password: 'correct horse battery',
  })
  expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toEqual(NURSE)
})

it('explains an expired link and offers the way back', async () => {
  stubApi({
    'POST /api/auth/complete-password': () =>
      json(401, {
        error: { code: 'invalid_or_expired_link', message: 'This link is invalid or has expired. Request a new one.' },
      }),
  })
  const { queryClient } = renderWithProviders(<SetPasswordPage />, {
    path: `/set-password#token_hash=${TOKEN}&type=recovery`,
  })
  expect(screen.getByRole('heading', { level: 1, name: 'Choose a new password' })).toBeTruthy()
  await userEvent.type(screen.getByLabelText('New password'), 'correct horse battery')
  await userEvent.type(screen.getByLabelText('Confirm password'), 'correct horse battery')
  await userEvent.click(screen.getByRole('button', { name: 'Save new password' }))
  expect((await screen.findByRole('alert')).textContent).toContain('no longer works')
  expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeUndefined()
  expect(window.location.pathname).toBe('/set-password')
  expect(screen.getByRole('link', { name: 'Back to sign in' }).getAttribute('href')).toBe('/')
})

it('shows the incomplete-link state without a token', () => {
  stubApi({})
  const { container } = renderWithProviders(<SetPasswordPage />, { path: '/set-password' })
  expect(screen.getByRole('heading', { level: 1, name: 'This link is incomplete' })).toBeTruthy()
  expect(screen.queryByLabelText('Password')).toBeNull()
  expect(container.firstChild).toMatchSnapshot()
})
