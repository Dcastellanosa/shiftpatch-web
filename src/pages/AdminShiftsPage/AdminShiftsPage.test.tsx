// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, stubApi } from '../../../tests/fake-api.ts'
import { AdminShiftsPage } from './AdminShiftsPage.tsx'

afterEach(() => vi.unstubAllGlobals())

it('shows all status counts and the empty admin table', async () => {
  window.history.replaceState(null, '', '/admin/shifts')
  stubApi({
    'GET /api/branches': () => json(200, { branches: [] }),
    'GET /api/shifts': () => json(200, { shifts: [] }),
  })
  const { container } = render(<AdminShiftsPage />)
  await screen.findByText('No shifts match these filters')
  expect(container.firstChild).toMatchSnapshot()
})
