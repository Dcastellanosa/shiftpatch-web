// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AGENCY_ID, json, makeAgency, stubApi } from '../../../../tests/fake-api.ts'
import { createTestQueryClient, withProviders } from '../../../../tests/render-with-providers.tsx'
import { agencyKeys } from '../../../entities/agency/queries/index.ts'
import { BRANCHES_QUERY_KEY } from '../../../entities/branch/use-branches/index.ts'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { useUpdateAgency } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('deactivates the agency and refreshes agencies, branches and shifts', async () => {
  const agency = makeAgency({ status: 'inactive' })
  const fetchMock = stubApi({ [`PATCH /api/admin/agencies/${AGENCY_ID}`]: () => json(200, { agency }) })
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const { result } = renderHook(() => useUpdateAgency(AGENCY_ID), { wrapper: withProviders({ queryClient }) })

  await act(() => result.current.mutateAsync({ status: 'inactive' }))

  expect(fetchMock.mock.calls[0]![1]?.method).toBe('PATCH')
  expect(invalidate).toHaveBeenCalledWith({ queryKey: agencyKeys.all })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: BRANCHES_QUERY_KEY })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: shiftKeys.all })
  expect(useUiStore.getState().toasts.map((t) => t.title)).toEqual(['Agency deactivated'])
})

it('renames without touching shift data', async () => {
  stubApi({ [`PATCH /api/admin/agencies/${AGENCY_ID}`]: () => json(200, { agency: makeAgency({ name: 'Renamed' }) }) })
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const { result } = renderHook(() => useUpdateAgency(AGENCY_ID), { wrapper: withProviders({ queryClient }) })
  await act(() => result.current.mutateAsync({ name: 'Renamed' }))
  expect(invalidate).toHaveBeenCalledTimes(1)
  expect(useUiStore.getState().toasts.map((t) => t.title)).toEqual(['Agency updated'])
})
