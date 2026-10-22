// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../../tests/fake-api.ts'
import { createTestQueryClient, withProviders } from '../../../../tests/render-with-providers.tsx'
import { MY_SHIFTS_QUERY_KEY, shiftKeys } from '../../../entities/shift/queries/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { useClaimShift } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('claims, refreshes shift data and announces the result', async () => {
  const shift = makeShift()
  const claimed = makeShift({ status: 'filled', claimedBy: 'nurse-1' })
  stubApi({ [`POST /api/shifts/${shift.id}/claim`]: () => json(200, claimed) })
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(shiftKeys.list(), [shift])
  queryClient.setQueryData(MY_SHIFTS_QUERY_KEY, { upcoming: [], past: [] })
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const { result } = renderHook(useClaimShift, { wrapper: withProviders({ queryClient }) })

  await act(() => result.current.mutateAsync(shift.id))

  expect(invalidate).toHaveBeenCalledWith({ queryKey: shiftKeys.all })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: MY_SHIFTS_QUERY_KEY })
  expect(useUiStore.getState().toasts).toEqual([
    expect.objectContaining({
      kind: 'success',
      title: 'Shift claimed',
      body: 'RN · Sunrise Health Staffing · Thu, Jan 10, 2030',
      link: { to: '/my-shifts', label: 'View My Shifts' },
    }),
  ])
})

it('announces a refused claim with the API’s own message and refreshes the list', async () => {
  const shift = makeShift({ id: 'shift-3' })
  stubApi({
    [`POST /api/shifts/${shift.id}/claim`]: () => json(403, { error: 'Credential expired, cannot claim shift' }),
  })
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const { result } = renderHook(useClaimShift, { wrapper: withProviders({ queryClient }) })

  await act(() => result.current.mutateAsync(shift.id).catch(() => undefined))

  await waitFor(() => expect(result.current.error).toMatchObject({ status: 403 }))
  expect(useUiStore.getState().toasts).toEqual([
    expect.objectContaining({
      kind: 'error',
      title: 'Shift not claimed',
      body: 'Credential expired, cannot claim shift',
    }),
  ])
  expect(invalidate).toHaveBeenCalledWith({ queryKey: shiftKeys.all })
})
