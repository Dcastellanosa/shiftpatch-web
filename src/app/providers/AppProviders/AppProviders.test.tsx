// @vitest-environment jsdom
import { useQueryClient } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useLocation } from 'react-router'
import { NURSE, json, stubApi } from '../../../../tests/fake-api.ts'
import { useSession } from '../../../features/auth/session-context/index.ts'
import { AppProviders } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

function Probe() {
  const session = useSession()
  const { pathname } = useLocation()
  const client = useQueryClient()
  return (
    <p>
      {session.loading ? 'Checking' : session.user?.fullName} at {pathname}; retry=
      {String(client.getDefaultOptions().queries?.retry !== false)}
    </p>
  )
}

it('provides the router, a query client and the session', async () => {
  window.history.replaceState(null, '', '/shifts')
  stubApi({ 'GET /api/auth/me': () => json(200, { user: NURSE }) })
  render(
    <AppProviders>
      <Probe />
    </AppProviders>,
  )
  expect(await screen.findByText('Ava Thompson at /shifts; retry=true')).toBeTruthy()
})
