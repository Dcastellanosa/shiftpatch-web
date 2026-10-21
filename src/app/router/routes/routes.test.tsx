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

it('routes the nurses screen for agency users', async () => {
  stubApi({ 'GET /api/branches': () => json(200, { branches: [] }), 'GET /api/agency/nurses': () => json(200, { nurses: [] }) })
  renderWithProviders(<AppRoutes role="agency" />, { path: '/agency/nurses' })
  expect(screen.getByRole('heading', { level: 1, name: 'Nurses' })).toBeTruthy()
  expect(await screen.findByText('No nurses yet')).toBeTruthy()
})

it('routes the agency detail screen for admins only', async () => {
  stubApi({
    'GET /api/admin/agencies/a1000000-0000-4000-8000-000000000001': () => json(200, { agency: { id: 'a1000000-0000-4000-8000-000000000001', name: 'Northwind Care Staffing', status: 'active', branchCount: 0, createdAt: '2029-11-01T00:00:00.000Z', updatedAt: '2029-11-01T00:00:00.000Z' }, branches: [] }),
  })
  renderWithProviders(<AppRoutes role="admin" />, { path: '/admin/agencies/a1000000-0000-4000-8000-000000000001' })
  expect(await screen.findByRole('heading', { level: 1, name: 'Northwind Care Staffing' })).toBeTruthy()
})
