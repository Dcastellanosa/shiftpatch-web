// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, stubApi } from '../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../tests/render-with-providers.tsx'
import { MyShiftsPage } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('shows empty upcoming and past sections', async () => {
  stubApi({ 'GET /api/me/shifts': () => json(200, { upcoming: [], past: [] }) })
  const { container } = renderWithProviders(<MyShiftsPage />, { path: '/my-shifts' })
  await screen.findByText('No upcoming shifts')
  expect(container.firstChild).toMatchSnapshot()
})
