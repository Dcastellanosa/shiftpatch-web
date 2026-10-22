// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../../tests/fake-api.ts'
import { renderWithProviders } from '../../../../tests/render-with-providers.tsx'
import { CancelShiftControl } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('cancels in advance with one click when no reason picker is shown (nurse)', async () => {
  const fetchMock = stubApi({ 'POST /api/shifts/shift-2/cancel': () => json(200, makeShift({ id: 'shift-2' })) })
  renderWithProviders(<CancelShiftControl shiftId="shift-2" />)
  expect(screen.queryByLabelText('Cancellation reason')).toBeNull()

  await userEvent.click(screen.getByTestId('shift-cancel-button'))

  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())
  expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({ reason: 'advance' })
})

it('lets an agency pick no-show before cancelling', async () => {
  const fetchMock = stubApi({ 'POST /api/shifts/shift-2/cancel': () => json(200, makeShift({ id: 'shift-2' })) })
  const { container } = renderWithProviders(<CancelShiftControl shiftId="shift-2" withReason />)
  const reason = screen.getByLabelText('Cancellation reason') as HTMLSelectElement
  expect(reason.value).toBe('advance')
  expect(container.firstChild).toMatchSnapshot()

  await userEvent.selectOptions(reason, 'no-show')
  await userEvent.click(screen.getByRole('button', { name: 'Cancel shift' }))

  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())
  expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({ reason: 'no-show' })
})
