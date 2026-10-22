// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { NURSE, authResponse, json, makeShift, stubApi } from '../../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../../tests/render-with-providers.tsx'
import { listShifts } from '../../../shared/api/client/index.ts'
import { hasAccessToken } from '../../../shared/api/token/index.ts'
import { useSession } from '../session-context/index.ts'
import { SessionProvider } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

function SessionProbe() {
  const session = useSession()
  return (
    <div>
      <p>{session.loading ? 'Checking' : (session.user?.name ?? 'Signed out')}</p>
      {session.error && <p role="alert">{session.error.message}</p>}
      <button type="button" onClick={() => void session.login('maria.lopez@example.com', 'pw')}>
        Sign In
      </button>
      <button type="button" onClick={() => void session.logout()}>
        Sign Out
      </button>
    </div>
  )
}

const probe = (
  <SessionProvider>
    <SessionProbe />
  </SessionProvider>
)

it('starts signed out without asking the API (the token lives only in memory)', async () => {
  const fetchMock = stubApi({})
  renderWithProviders(probe)
  await screen.findByText('Signed out')
  expect(fetchMock).not.toHaveBeenCalled()
  expect(hasAccessToken()).toBe(false)
})

it('signs in and keeps a rejected attempt from touching the cache or storing a token', async () => {
  let accept = false
  stubApi({
    'POST /api/auth/login': () => (accept ? authResponse(NURSE) : json(401, { error: 'Invalid email or password' })),
  })
  const { queryClient } = renderWithProviders(probe)
  await screen.findByText('Signed out')
  queryClient.setQueryData(['shifts', 'list'], [makeShift()])

  await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
  expect((await screen.findByRole('alert')).textContent).toBe('Invalid email or password')
  expect(queryClient.getQueryData(['shifts', 'list'])).toHaveLength(1)
  expect(hasAccessToken()).toBe(false)

  accept = true
  await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
  await screen.findByText('Maria Lopez')
  expect(screen.queryByRole('alert')).toBeNull()
  expect(queryClient.getQueryData(['shifts', 'list'])).toBeUndefined()
  expect(hasAccessToken()).toBe(true)
})

it('signs out, clears the cache and forgets the token', async () => {
  const fetchMock = stubApi({ 'POST /api/auth/logout': () => json(204) })
  const { queryClient } = renderWithProviders(probe, { user: NURSE })
  await screen.findByText('Maria Lopez')
  queryClient.setQueryData(['shifts', 'list'], [makeShift()])

  await userEvent.click(screen.getByRole('button', { name: 'Sign Out' }))

  await screen.findByText('Signed out')
  expect(queryClient.getQueryData(['shifts', 'list'])).toBeUndefined()
  expect(hasAccessToken()).toBe(false)
  expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(['/api/auth/logout'])
})

it('signs out locally when a request reports the token as expired', async () => {
  const { queryClient } = renderWithProviders(probe, { user: NURSE })
  await screen.findByText('Maria Lopez')
  stubApi({ 'GET /api/shifts': () => json(401, { error: 'Invalid or expired token' }) })
  queryClient.setQueryData(['shifts', 'list'], [makeShift()])

  await listShifts().catch(() => undefined)

  await screen.findByText('Signed out')
  expect(queryClient.getQueryData(['shifts', 'list'])).toBeUndefined()
  expect(hasAccessToken()).toBe(false)
})
