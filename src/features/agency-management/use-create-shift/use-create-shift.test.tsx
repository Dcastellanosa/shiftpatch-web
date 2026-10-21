// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../../tests/fake-api.ts'
import { createTestQueryClient, withProviders } from '../../../../tests/render-with-providers.tsx'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { useCreateShift } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

const INPUT = { branchId: 'branch-1', title: 'Night RN', startsAt: '2030-01-11T01:00:00.000Z', endsAt: '2030-01-11T09:00:00.000Z' }

it('creates the shift, refreshes the lists and announces it', async () => {
  const shift = makeShift({ title: 'Night RN' })
  const fetchMock = stubApi({ 'POST /api/shifts': () => json(201, { shift }) })
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const { result } = renderHook(useCreateShift, { wrapper: withProviders({ queryClient }) })

  await act(() => result.current.mutateAsync(INPUT))

  expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual(INPUT)
  expect(invalidate).toHaveBeenCalledWith({ queryKey: shiftKeys.all })
  expect(useUiStore.getState().toasts).toEqual([
    expect.objectContaining({ kind: 'success', title: 'Shift created', body: 'Night RN at Downtown Clinic is open for eligible nurses.' }),
  ])
})

it('keeps validation failures silent apart from the mutation error', async () => {
  stubApi({ 'POST /api/shifts': () => json(400, { error: { code: 'validation_error', message: 'Invalid' } }) })
  const { result } = renderHook(useCreateShift, { wrapper: withProviders() })

  await act(() => result.current.mutateAsync(INPUT).catch(() => undefined))

  await waitFor(() => expect(result.current.error).toMatchObject({ status: 400, code: 'validation_error' }))
  expect(useUiStore.getState().toasts).toEqual([])
})
