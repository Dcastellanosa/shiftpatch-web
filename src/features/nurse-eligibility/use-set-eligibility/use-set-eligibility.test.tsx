// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { BRANCH_ID, NURSE_ID, json, stubApi } from '../../../../tests/fake-api.ts'
import { createTestQueryClient, withProviders } from '../../../../tests/render-with-providers.tsx'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { AGENCY_NURSES_QUERY_KEY } from '../use-agency-nurses/index.ts'
import { useSetEligibility } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

const input = { nurseId: NURSE_ID, nurseName: 'Ava Thompson', branchId: BRANCH_ID, branchName: 'Downtown Clinic' }

it('activates with PUT and refreshes nurses and shifts', async () => {
  const fetchMock = stubApi({
    [`PUT /api/nurses/${NURSE_ID}/eligibility/${BRANCH_ID}`]: () =>
      json(200, { eligibility: { nurseId: NURSE_ID, branchId: BRANCH_ID, status: 'active', activatedAt: null } }),
  })
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const { result } = renderHook(useSetEligibility, { wrapper: withProviders({ queryClient }) })
  await act(() => result.current.mutateAsync({ ...input, status: 'active' }))
  expect(fetchMock.mock.calls[0]![1]?.method).toBe('PUT')
  expect(invalidate).toHaveBeenCalledWith({ queryKey: AGENCY_NURSES_QUERY_KEY })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: shiftKeys.all })
  expect(useUiStore.getState().toasts).toEqual([
    expect.objectContaining({ kind: 'success', title: 'Nurse activated', body: 'Ava Thompson · Downtown Clinic' }),
  ])
})

it('suspends with DELETE and reports a failure as an error toast', async () => {
  stubApi({
    [`DELETE /api/nurses/${NURSE_ID}/eligibility/${BRANCH_ID}`]: () =>
      json(422, { error: 'This branch is inactive; eligibility cannot change' }),
  })
  const { result } = renderHook(useSetEligibility, { wrapper: withProviders() })
  await act(() => result.current.mutateAsync({ ...input, status: 'suspended' }).catch(() => undefined))
  expect(useUiStore.getState().toasts).toEqual([
    expect.objectContaining({ kind: 'error', title: 'Nurse not suspended' }),
  ])
  expect(useUiStore.getState().toasts[0]!.body).toContain('inactive')
})
