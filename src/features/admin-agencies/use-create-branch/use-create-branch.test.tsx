// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AGENCY_ID, json, makeAgencyBranch, stubApi } from '../../../../tests/fake-api.ts'
import { createTestQueryClient, withProviders } from '../../../../tests/render-with-providers.tsx'
import { agencyKeys } from '../../../entities/agency/queries/index.ts'
import { BRANCHES_QUERY_KEY } from '../../../entities/branch/use-branches/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { useCreateBranch } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('creates the branch under the agency and refreshes agencies and branches', async () => {
  const input = { name: 'Uptown Clinic', address: '1 Up Street', timezone: 'America/New_York' }
  const fetchMock = stubApi({
    [`POST /api/admin/agencies/${AGENCY_ID}/branches`]: () => json(201, { branch: makeAgencyBranch(input) }),
  })
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const { result } = renderHook(() => useCreateBranch(AGENCY_ID), { wrapper: withProviders({ queryClient }) })

  await act(() => result.current.mutateAsync(input))

  expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual(input)
  expect(invalidate).toHaveBeenCalledWith({ queryKey: agencyKeys.all })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: BRANCHES_QUERY_KEY })
  expect(useUiStore.getState().toasts).toEqual([
    expect.objectContaining({ title: 'Branch created', body: 'Uptown Clinic' }),
  ])
})
