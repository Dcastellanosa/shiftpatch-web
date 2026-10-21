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
  const claimed = makeShift({ status: 'claimed', assignedNurse: { id: 'u-nurse', fullName: 'Ava Thompson' } })
  stubApi({ [`POST /api/shifts/${shift.id}/claim`]: () => json(200, { shift: claimed }) })
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
      body: 'Med-Surg RN — Day at Downtown Clinic is now yours.',
      link: { to: '/my-shifts', label: 'View My Shifts' },
    }),
  ])
})

it('surfaces rule failures without a toast', async () => {
  const shift = makeShift()
  stubApi({ [`POST /api/shifts/${shift.id}/claim`]: () => json(422, { error: { code: 'credential_expired', message: 'Expired' } }) })
  const { result } = renderHook(useClaimShift, { wrapper: withProviders() })

  await act(() => result.current.mutateAsync(shift.id).catch(() => undefined))

  await waitFor(() => expect(result.current.error).toMatchObject({ status: 422, code: 'credential_expired' }))
  expect(useUiStore.getState().toasts).toEqual([])
})
