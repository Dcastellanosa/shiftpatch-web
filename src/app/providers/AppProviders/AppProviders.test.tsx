// @vitest-environment jsdom
import { useQueryClient } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useLocation } from 'react-router'
import { stubApi } from '../../../../tests/fake-api.ts'
import { useSession } from '../../../features/auth/session-context/index.ts'
import { AppProviders } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

function Probe() {
  const session = useSession()
  const { pathname } = useLocation()
  const client = useQueryClient()
  return (
    <p>
      {session.loading ? 'Checking' : (session.user?.name ?? 'anonymous')} at {pathname}; retry=
      {String(client.getDefaultOptions().queries?.retry !== false)}
    </p>
  )
}

it('provides the router, a query client and an anonymous session on load', async () => {
  window.history.replaceState(null, '', '/shifts')
  const fetchMock = stubApi({})
  render(
    <AppProviders>
      <Probe />
    </AppProviders>,
  )
  expect(await screen.findByText('anonymous at /shifts; retry=true')).toBeTruthy()
  expect(fetchMock).not.toHaveBeenCalled()
})
