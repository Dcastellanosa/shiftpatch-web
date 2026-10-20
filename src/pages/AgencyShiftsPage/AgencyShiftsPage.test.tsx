// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, stubApi } from '../../../tests/fake-api.ts'
import { AgencyShiftsPage } from './AgencyShiftsPage.tsx'

afterEach(() => vi.unstubAllGlobals())

it('shows the agency page without branches or shifts', async () => {
  window.history.replaceState(null, '', '/agency/shifts')
  stubApi({
    'GET /api/branches': () => json(200, { branches: [] }),
    'GET /api/shifts': () => json(200, { shifts: [] }),
  })
  const { container } = render(<AgencyShiftsPage />)
  await screen.findByText('No branches yet')
  await screen.findByText('No shifts match')
  expect(container.firstChild).toMatchSnapshot()
})
