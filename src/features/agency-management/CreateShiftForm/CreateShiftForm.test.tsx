// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeBranch, makeShift, stubApi } from '../../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../../tests/render-with-providers.tsx'
import { CreateShiftForm } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

function fill(role = 'RN', date = '2026-10-05', start = '19:00', end = '07:00') {
  fireEvent.change(screen.getByLabelText('Role'), { target: { value: role } })
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: date } })
  fireEvent.change(screen.getByLabelText('Start'), { target: { value: start } })
  fireEvent.change(screen.getByLabelText('End'), { target: { value: end } })
}

it('renders the contract form without a branch picker for a single-branch agency', () => {
  const { container } = renderWithProviders(<CreateShiftForm branches={[makeBranch()]} onCreated={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Post shift' })).toBeTruthy()
  expect(screen.queryByLabelText('Branch')).toBeNull()
  expect(screen.getByLabelText('Date').getAttribute('min')).toBeNull()
  expect(container.firstChild).toMatchSnapshot()
})

it('posts the facility-local body exactly and notes an overnight shift', async () => {
  const onCreated = vi.fn()
  const shift = makeShift({ date: '2026-10-05' })
  const fetchMock = stubApi({ 'POST /api/shifts': () => json(201, shift) })
  renderWithProviders(<CreateShiftForm branches={[makeBranch()]} onCreated={onCreated} />)
  fill()
  expect(screen.getByText(/ends the next day/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Post shift' }))
  await vi.waitFor(() => expect(onCreated).toHaveBeenCalledWith(shift))
  const [, init] = fetchMock.mock.calls[0]!
  expect(JSON.parse(String(init?.body))).toEqual({
    role: 'RN',
    date: '2026-10-05',
    startTime: '19:00',
    endTime: '07:00',
  })
})

it('asks for a branch only when the agency has several, and sends it', async () => {
  const fetchMock = stubApi({ 'POST /api/shifts': () => json(201, makeShift()) })
  renderWithProviders(
    <CreateShiftForm branches={[makeBranch(), makeBranch({ id: 'branch-2', name: 'Uptown Clinic' })]} />,
  )
  fireEvent.change(screen.getByLabelText('Branch'), { target: { value: 'branch-2' } })
  fill('LPN', '2026-10-06', '07:00', '19:00')
  fireEvent.click(screen.getByRole('button', { name: 'Post shift' }))
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())
  expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({
    role: 'LPN',
    date: '2026-10-06',
    startTime: '07:00',
    endTime: '19:00',
    branchId: 'branch-2',
  })
})

it('shows the API’s message when the post is refused', async () => {
  stubApi({ 'POST /api/shifts': () => json(400, { error: 'Choose the branch this shift is for' }) })
  renderWithProviders(<CreateShiftForm branches={[]} />)
  fill()
  fireEvent.click(screen.getByRole('button', { name: 'Post shift' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Choose the branch this shift is for')
})
