// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../../tests/render-with-providers.tsx'
import { ShiftHistory } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('renders a recorded shift event', async () => {
  const shift = makeShift()
  const event = {
    id: 'event-1',
    eventType: 'claimed',
    previousStatus: 'open',
    newStatus: 'claimed',
    reason: 'Accepted by nurse',
    occurredAt: '2030-01-10T14:00:00.000Z',
    actor: { id: 'nurse-1', fullName: 'Ava Thompson' },
  }
  stubApi({ [`GET /api/shifts/${shift.id}/events`]: () => json(200, { events: [event] }) })
  const { container } = renderWithProviders(<ShiftHistory shiftId={shift.id} />)
  await screen.findByText('Claimed')
  expect(screen.getByTestId('shift-history')).toBe(container.firstChild)
  expect(container.firstChild).toMatchSnapshot()
})

it('shows an error state with retry when the history fails', async () => {
  const shift = makeShift()
  stubApi({
    [`GET /api/shifts/${shift.id}/events`]: () =>
      json(500, { error: { code: 'internal_error', message: 'Internal server error' } }),
  })
  renderWithProviders(<ShiftHistory shiftId={shift.id} />)
  expect(await screen.findByText('Something went wrong')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Try Again' })).toBeTruthy()
})
