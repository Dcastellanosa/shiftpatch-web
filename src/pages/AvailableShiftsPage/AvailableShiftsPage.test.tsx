// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, stubApi } from '../../../tests/fake-api.ts'
import { AvailableShiftsPage } from './AvailableShiftsPage.tsx'

afterEach(() => vi.unstubAllGlobals())

it('shows the empty available-shifts state', async () => {
  stubApi({ 'GET /api/shifts': () => json(200, { shifts: [] }) })
  const { container } = render(<AvailableShiftsPage />)
  await screen.findByText('No open shifts right now')
  expect(container.firstChild).toMatchSnapshot()
})
