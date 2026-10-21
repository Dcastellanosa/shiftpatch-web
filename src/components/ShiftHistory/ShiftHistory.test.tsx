// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../tests/fake-api.ts'
import { ShiftHistory } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('renders a recorded shift event', async () => {
  const shift = makeShift()
  const event = {
    id: 'event-1', eventType: 'claimed', previousStatus: 'open', newStatus: 'claimed',
    reason: 'Accepted by nurse', occurredAt: '2030-01-10T14:00:00.000Z',
    actor: { id: 'nurse-1', fullName: 'Ava Thompson' },
  }
  stubApi({ [`GET /api/shifts/${shift.id}/events`]: () => json(200, { events: [event] }) })
  const { container } = render(<ShiftHistory shiftId={shift.id} />)
  await screen.findByText('Claimed')
  expect(container.firstChild).toMatchSnapshot()
})
