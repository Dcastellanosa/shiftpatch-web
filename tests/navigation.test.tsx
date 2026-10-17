// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App.tsx'
import { SessionProvider } from '../src/auth/SessionProvider.tsx'
import type { SessionUser } from '../src/lib/api-client.ts'
import { ADMIN, AGENCY, NURSE, json, makeShift, stubApi } from './fake-api.ts'

function renderAt(path: string, user: SessionUser | null, extra: Parameters<typeof stubApi>[0] = {}) {
  window.history.replaceState(null, '', path)
  const fetchMock = stubApi({
    'GET /api/auth/me': () =>
      user ? json(200, { user }) : json(401, { error: { code: 'unauthenticated', message: 'Authentication required' } }),
    'GET /api/shifts': () => json(200, { shifts: [] }),
    'GET /api/branches': () => json(200, { branches: [] }),
    'GET /api/me/shifts': () => json(200, { upcoming: [], past: [] }),
    ...extra,
  })
  render(
    <SessionProvider>
      <App />
    </SessionProvider>,
  )
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const navLinks = async () => {
  const nav = await screen.findByRole('navigation', { name: 'Main' })
  return within(nav)
    .getAllByRole('link')
    .map((link) => link.textContent)
}

describe('role-aware navigation', () => {
  it('shows the sign-in form without a session', async () => {
    renderAt('/shifts', null)
    expect(await screen.findByRole('heading', { name: 'Sign In' })).toBeTruthy()
    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it.each([
    [NURSE, ['Available Shifts', 'My Shifts']],
    [AGENCY, ['Agency Shifts']],
    [ADMIN, ['All Shifts']],
  ])('shows only the $role screens', async (user, expected) => {
    renderAt('/', user)
    expect(await navLinks()).toEqual(expected)
  })

  it.each([
    [NURSE, '/shifts', 'Available Shifts'],
    [AGENCY, '/agency/shifts', 'Agency Shifts'],
    [ADMIN, '/admin/shifts', 'All Shifts'],
  ])('redirects $role from / to their home screen', async (user, path, heading) => {
    renderAt('/', user)
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeTruthy()
    expect(window.location.pathname).toBe(path)
  })

  it('blocks a nurse from the admin screen without calling admin data', async () => {
    const fetchMock = renderAt('/admin/shifts', NURSE)
    expect(await screen.findByText('You do not have access to this page')).toBeTruthy()
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(['/api/auth/me'])
  })

  it('blocks an agency user from nurse screens', async () => {
    renderAt('/my-shifts', AGENCY)
    expect(await screen.findByText('You do not have access to this page')).toBeTruthy()
  })

  it('explains when an account has no role yet', async () => {
    renderAt('/', { ...NURSE, role: null })
    expect(await screen.findByText('Your account is not set up yet')).toBeTruthy()
  })

  it('navigates between nurse screens client-side', async () => {
    renderAt('/shifts', NURSE)
    await userEvent.click(await screen.findByRole('link', { name: 'My Shifts' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'My Shifts' })).toBeTruthy()
    expect(window.location.pathname).toBe('/my-shifts')
    expect(screen.getByRole('link', { name: 'My Shifts' }).getAttribute('aria-current')).toBe('page')
  })
})

describe('screen states', () => {
  it('shows an error state with retry when the list fails', async () => {
    renderAt('/shifts', NURSE, {
      'GET /api/shifts': () => json(500, { error: { code: 'internal_error', message: 'Internal server error' } }),
    })
    expect(await screen.findByText('Something went wrong')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeTruthy()
  })

  it('shows an empty state when there are no open shifts', async () => {
    renderAt('/shifts', NURSE)
    expect(await screen.findByText('No open shifts right now')).toBeTruthy()
  })

  it('shows agency shifts with status and assigned nurse', async () => {
    renderAt('/agency/shifts', AGENCY, {
      'GET /api/shifts': () =>
        json(200, {
          shifts: [makeShift({ status: 'claimed', assignedNurse: { id: NURSE.id, fullName: 'Ava Thompson' } })],
        }),
    })
    const row = (await screen.findByText('Med-Surg RN — Day')).closest('tr')!
    expect(within(row).getByText('Claimed')).toBeTruthy()
    expect(within(row).getByText('Ava Thompson')).toBeTruthy()
  })
})
