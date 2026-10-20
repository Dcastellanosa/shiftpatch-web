// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, stubApi } from '../../../tests/fake-api.ts'
import { MyShiftsPage } from './MyShiftsPage.tsx'

afterEach(() => vi.unstubAllGlobals())

it('shows empty upcoming and past sections', async () => {
  stubApi({ 'GET /api/me/shifts': () => json(200, { upcoming: [], past: [] }) })
  const { container } = render(<MyShiftsPage />)
  await screen.findByText('No upcoming shifts')
  expect(container.firstChild).toMatchSnapshot()
})
