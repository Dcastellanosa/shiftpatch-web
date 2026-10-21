// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { NURSE, json, makeShift, stubApi } from '../../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../../tests/render-with-providers.tsx'
import { useSession } from '../session-context/index.ts'
import { SessionProvider } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

function SessionProbe() {
  const session = useSession()
  return (
    <div>
      <p>{session.loading ? 'Checking' : (session.user?.fullName ?? 'Signed out')}</p>
      {session.error && <p role="alert">{session.error.message}</p>}
      <button type="button" onClick={() => void session.login('nurse@example.test', 'pw')}>
        Sign In
      </button>
      <button type="button" onClick={() => void session.logout()}>
        Sign Out
      </button>
    </div>
  )
}

it('reads session truth from GET /api/auth/me', async () => {
  const fetchMock = stubApi({ 'GET /api/auth/me': () => json(200, { user: NURSE }) })
  renderWithProviders(
    <SessionProvider>
      <SessionProbe />
    </SessionProvider>,
  )
  await screen.findByText('Ava Thompson')
  expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/auth/me')
})

it('signs in and keeps a rejected attempt from touching the cache', async () => {
  let accept = false
  stubApi({
    'GET /api/auth/me': () => json(401, { error: { code: 'unauthenticated', message: 'Authentication required' } }),
    'POST /api/auth/login': () =>
      accept
        ? json(200, { user: NURSE })
        : json(401, { error: { code: 'invalid_credentials', message: 'Invalid email or password' } }),
  })
  const { queryClient } = renderWithProviders(
    <SessionProvider>
      <SessionProbe />
    </SessionProvider>,
  )
  await screen.findByText('Signed out')
  queryClient.setQueryData(['shifts', 'list', {}], [makeShift()])

  await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
  expect((await screen.findByRole('alert')).textContent).toBe('Invalid email or password')
  expect(queryClient.getQueryData(['shifts', 'list', {}])).toHaveLength(1)

  accept = true
  await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
  await screen.findByText('Ava Thompson')
  expect(screen.queryByRole('alert')).toBeNull()
  expect(queryClient.getQueryData(['shifts', 'list', {}])).toBeUndefined()
})

it('signs out, clears the cache and re-asks the API for the session', async () => {
  let signedIn = true
  const fetchMock = stubApi({
    'GET /api/auth/me': () =>
      signedIn
        ? json(200, { user: NURSE })
        : json(401, { error: { code: 'unauthenticated', message: 'Authentication required' } }),
    'POST /api/auth/logout': () => {
      signedIn = false
      return json(204)
    },
  })
  const { queryClient } = renderWithProviders(
    <SessionProvider>
      <SessionProbe />
    </SessionProvider>,
  )
  await screen.findByText('Ava Thompson')
  queryClient.setQueryData(['shifts', 'list', {}], [makeShift()])

  await userEvent.click(screen.getByRole('button', { name: 'Sign Out' }))

  await screen.findByText('Signed out')
  expect(queryClient.getQueryData(['shifts', 'list', {}])).toBeUndefined()
  expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(['/api/auth/me', '/api/auth/logout', '/api/auth/me'])
})
