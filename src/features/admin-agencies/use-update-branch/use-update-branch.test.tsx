// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AGENCY_ID, BRANCH_ID, json, makeAgencyBranch, stubApi } from '../../../../tests/fake-api.ts'
import { createTestQueryClient, withProviders } from '../../../../tests/render-with-providers.tsx'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { useUpdateBranch } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('deactivates a branch through its agency and refreshes shift data', async () => {
  const fetchMock = stubApi({
    [`PATCH /api/admin/agencies/${AGENCY_ID}/branches/${BRANCH_ID}`]: () =>
      json(200, { branch: makeAgencyBranch({ status: 'inactive' }) }),
  })
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const { result } = renderHook(() => useUpdateBranch(AGENCY_ID), { wrapper: withProviders({ queryClient }) })

  await act(() => result.current.mutateAsync({ branchId: BRANCH_ID, input: { status: 'inactive' } }))

  expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({ status: 'inactive' })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: shiftKeys.all })
  expect(useUiStore.getState().toasts.map((t) => t.title)).toEqual(['Branch deactivated'])
})

it('edits a branch without touching shift data', async () => {
  stubApi({
    [`PATCH /api/admin/agencies/${AGENCY_ID}/branches/${BRANCH_ID}`]: () =>
      json(200, { branch: makeAgencyBranch({ name: 'Renamed' }) }),
  })
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const { result } = renderHook(() => useUpdateBranch(AGENCY_ID), { wrapper: withProviders({ queryClient }) })
  await act(() => result.current.mutateAsync({ branchId: BRANCH_ID, input: { name: 'Renamed' } }))
  expect(invalidate).toHaveBeenCalledTimes(2)
  expect(useUiStore.getState().toasts.map((t) => t.title)).toEqual(['Branch updated'])
})
