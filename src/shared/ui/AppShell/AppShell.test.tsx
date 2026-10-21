// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { NURSE, json, stubApi } from '../../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../../tests/render-with-providers.tsx'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { AppShell } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('renders nurse navigation and account details', async () => {
  stubApi({ 'GET /api/auth/me': () => json(200, { user: NURSE }) })
  const { container } = renderWithProviders(
    <AppShell role="nurse">
      <h1>Available Shifts</h1>
    </AppShell>,
    { path: '/shifts', session: true },
  )
  await screen.findByText('Ava Thompson')
  const current = screen.getByRole('link', { name: 'Available Shifts' })
  expect(current.getAttribute('aria-current')).toBe('page')
  expect(current.className).toBe('nav__link')
  expect(container.firstChild).toMatchSnapshot()
})

it('shows queued notifications', async () => {
  stubApi({ 'GET /api/auth/me': () => json(200, { user: NURSE }) })
  renderWithProviders(
    <AppShell role="nurse">
      <h1>Available Shifts</h1>
    </AppShell>,
    { path: '/shifts', session: true },
  )
  await screen.findByText('Ava Thompson')
  useUiStore.getState().pushToast({ kind: 'success', title: 'Shift claimed' })
  expect(await screen.findByText('Shift claimed')).toBeTruthy()
})

it('signs out through the API', async () => {
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
    <AppShell role="nurse">
      <h1>Available Shifts</h1>
    </AppShell>,
    { path: '/shifts', session: true },
  )
  await screen.findByText('Ava Thompson')

  await userEvent.click(screen.getByRole('button', { name: 'Sign Out' }))

  await vi.waitFor(() => expect(queryClient.getQueryData(['session'])).toBeNull())
  expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(['/api/auth/me', '/api/auth/logout', '/api/auth/me'])
})
