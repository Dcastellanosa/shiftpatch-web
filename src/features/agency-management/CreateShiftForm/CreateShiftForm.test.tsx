// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../../tests/render-with-providers.tsx'
import type { Branch } from '../../../shared/api/client/index.ts'
import { CreateShiftForm } from './index.ts'

const BRANCH: Branch = {
  id: 'branch-1', name: 'Downtown Clinic', address: '120 Main Street', timezone: 'America/New_York',
  status: 'active',
  agency: { id: 'agency-1', name: 'Northwind Care Staffing' },
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('renders a branch-local shift form', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2030-01-01T12:00:00.000Z'))
  const { container } = renderWithProviders(<CreateShiftForm branches={[BRANCH]} onCreated={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Create Shift' })).toBeTruthy()
  expect(container.firstChild).toMatchSnapshot()
})

it('submits an overnight shift as UTC instants', async () => {
  const onCreated = vi.fn()
  const shift = makeShift()
  const fetchMock = stubApi({ 'POST /api/shifts': () => json(201, { shift }) })
  renderWithProviders(<CreateShiftForm branches={[BRANCH]} onCreated={onCreated} />)
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Night RN' } })
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2030-01-10' } })
  fireEvent.change(screen.getByLabelText('Start'), { target: { value: '20:00' } })
  fireEvent.change(screen.getByLabelText('End'), { target: { value: '04:00' } })
  fireEvent.click(screen.getByRole('button', { name: 'Create Shift' }))
  await vi.waitFor(() => expect(onCreated).toHaveBeenCalledWith(shift))
  const [, init] = fetchMock.mock.calls[0]!
  expect(JSON.parse(String(init?.body))).toEqual({
    branchId: BRANCH.id,
    title: 'Night RN',
    startsAt: '2030-01-11T01:00:00.000Z',
    endsAt: '2030-01-11T09:00:00.000Z',
  })
})
