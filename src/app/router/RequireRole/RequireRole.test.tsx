// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../tests/render-with-providers.tsx'
import { RequireRole } from './index.ts'

it('renders the screen when the role may see it', () => {
  renderWithProviders(<RequireRole role="nurse"><h1>Available Shifts</h1></RequireRole>, { path: '/shifts' })
  expect(screen.getByRole('heading', { name: 'Available Shifts' })).toBeTruthy()
})

it('blocks other roles without rendering the screen', () => {
  const Screen = vi.fn(() => <h1>All Shifts</h1>)
  renderWithProviders(<RequireRole role="nurse"><Screen /></RequireRole>, { path: '/admin/shifts' })
  expect(screen.getByRole('alert').textContent).toContain('You do not have access to this page')
  expect(screen.getByRole('link', { name: 'Go to your shifts' }).getAttribute('href')).toBe('/shifts')
  expect(Screen).not.toHaveBeenCalled()
})
