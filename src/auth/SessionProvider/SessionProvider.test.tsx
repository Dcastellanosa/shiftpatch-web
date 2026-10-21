// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useSession } from '../session-context/index.ts'
import { NURSE, json, stubApi } from '../../../tests/fake-api.ts'
import { SessionProvider } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

function SessionProbe() {
  const session = useSession()
  return <p>{session.loading ? 'Checking' : session.user?.fullName ?? 'Signed out'}</p>
}

it('reads session truth from GET /api/auth/me', async () => {
  const fetchMock = stubApi({ 'GET /api/auth/me': () => json(200, { user: NURSE }) })
  render(<SessionProvider><SessionProbe /></SessionProvider>)
  await screen.findByText('Ava Thompson')
  expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/auth/me')
})
