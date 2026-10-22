// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../../tests/fake-api.ts'
import { createTestQueryClient, withProviders } from '../../../../tests/render-with-providers.tsx'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { useCreateShift } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

const INPUT = { role: 'RN', date: '2026-10-05', startTime: '07:00', endTime: '19:00' }

it('posts the shift, refreshes the lists and announces it', async () => {
  const shift = makeShift({ id: 'shift-4', date: '2026-10-05', startTime: '07:00', endTime: '19:00' })
  const fetchMock = stubApi({ 'POST /api/shifts': () => json(201, shift) })
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const { result } = renderHook(useCreateShift, { wrapper: withProviders({ queryClient }) })

  await act(() => result.current.mutateAsync(INPUT))

  expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual(INPUT)
  expect(invalidate).toHaveBeenCalledWith({ queryKey: shiftKeys.all })
  expect(useUiStore.getState().toasts).toEqual([
    expect.objectContaining({
      kind: 'success',
      title: 'Shift posted',
      body: 'RN on Mon, Oct 5, 2026, 07:00 – 19:00, is open for nurses.',
    }),
  ])
})

it('keeps validation failures silent apart from the mutation error', async () => {
  stubApi({ 'POST /api/shifts': () => json(400, { error: 'Invalid request body' }) })
  const { result } = renderHook(useCreateShift, { wrapper: withProviders() })

  await act(() => result.current.mutateAsync(INPUT).catch(() => undefined))

  await waitFor(() => expect(result.current.error).toMatchObject({ status: 400, message: 'Invalid request body' }))
  expect(useUiStore.getState().toasts).toEqual([])
})
