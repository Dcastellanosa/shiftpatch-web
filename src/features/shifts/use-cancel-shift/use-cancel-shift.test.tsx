// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../../tests/fake-api.ts'
import { createTestQueryClient, withProviders } from '../../../../tests/render-with-providers.tsx'
import { MY_SHIFTS_QUERY_KEY, shiftKeys } from '../../../entities/shift/queries/index.ts'
import { timesheetKeys } from '../../../entities/timesheet/queries/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { useCancelShift } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('cancels with the reason, refreshes shifts and timesheets and announces the reopened shift', async () => {
  const fetchMock = stubApi({ 'POST /api/shifts/shift-2/cancel': () => json(200, makeShift({ id: 'shift-2' })) })
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const { result } = renderHook(useCancelShift, { wrapper: withProviders({ queryClient }) })

  await act(() => result.current.mutateAsync({ shiftId: 'shift-2', reason: 'no-show' }))

  expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({ reason: 'no-show' })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: shiftKeys.all })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: MY_SHIFTS_QUERY_KEY })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: timesheetKeys.all })
  expect(useUiStore.getState().toasts).toEqual([
    expect.objectContaining({
      kind: 'success',
      title: 'Shift reopened',
      body: 'Marked as a no-show. The shift is open again.',
    }),
  ])
})

it('announces a refusal with the API’s message', async () => {
  stubApi({ 'POST /api/shifts/shift-2/cancel': () => json(403, { error: 'Nurses can only cancel in advance' }) })
  const { result } = renderHook(useCancelShift, { wrapper: withProviders() })
  await act(() => result.current.mutateAsync({ shiftId: 'shift-2', reason: 'no-show' }).catch(() => undefined))
  await waitFor(() => expect(result.current.error).toMatchObject({ status: 403 }))
  expect(useUiStore.getState().toasts).toEqual([
    expect.objectContaining({ kind: 'error', title: 'Shift not cancelled', body: 'Nurses can only cancel in advance' }),
  ])
})
