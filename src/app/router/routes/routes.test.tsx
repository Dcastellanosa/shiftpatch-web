// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, stubApi } from '../../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../../tests/render-with-providers.tsx'
import { AppRoutes } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('redirects / to the role home with replace', async () => {
  stubApi({ 'GET /api/shifts': () => json(200, { shifts: [] }) })
  renderWithProviders(<AppRoutes role="nurse" />, { path: '/' })
  expect(await screen.findByRole('heading', { level: 1, name: 'Available Shifts' })).toBeTruthy()
  expect(window.location.pathname).toBe('/shifts')
  expect(window.history.length).toBe(1)
})

it('shows "Page not found" for an unknown path', () => {
  renderWithProviders(<AppRoutes role="admin" />, { path: '/nowhere' })
  expect(screen.getByText('Page not found')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Go to your shifts' }).getAttribute('href')).toBe('/admin/shifts')
})

it.each([
  ['/agency/nurses', 'agency', 'Nurses'],
  ['/admin/agencies', 'admin', 'Agencies'],
  ['/admin/users', 'admin', 'Users'],
] as const)('renders the %s placeholder for the %s role', (path, role, heading) => {
  stubApi({})
  renderWithProviders(<AppRoutes role={role} />, { path })
  expect(screen.getByRole('heading', { level: 1, name: heading })).toBeTruthy()
  expect(screen.getByText('Coming soon')).toBeTruthy()
})
