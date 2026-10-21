// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AGENCY_ID, json, stubApi } from '../../../../tests/fake-api.ts'
import { createTestQueryClient, withProviders } from '../../../../tests/render-with-providers.tsx'
import { agencyKeys } from '../../../entities/agency/queries/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { useDeleteAgency } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('sends DELETE, drops the detail query and refreshes the lists', async () => {
  const fetchMock = stubApi({ [`DELETE /api/admin/agencies/${AGENCY_ID}`]: () => ({ status: 204 }) })
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(agencyKeys.detail(AGENCY_ID), { agency: {}, branches: [] })
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const { result } = renderHook(useDeleteAgency, { wrapper: withProviders({ queryClient }) })
  await act(() => result.current.mutateAsync({ id: AGENCY_ID, name: 'Northwind' }))
  expect(fetchMock.mock.calls[0]![1]?.method).toBe('DELETE')
  expect(queryClient.getQueryData(agencyKeys.detail(AGENCY_ID))).toBeUndefined()
  expect(invalidate).toHaveBeenCalledWith({ queryKey: agencyKeys.all })
  expect(useUiStore.getState().toasts).toEqual([
    expect.objectContaining({ kind: 'success', title: 'Agency deleted', body: 'Northwind' }),
  ])
})

it('reports agency_has_shifts as an error toast', async () => {
  stubApi({
    [`DELETE /api/admin/agencies/${AGENCY_ID}`]: () =>
      json(409, {
        error: {
          code: 'agency_has_shifts',
          message: 'This agency has shifts and cannot be deleted; deactivate it instead',
        },
      }),
  })
  const { result } = renderHook(useDeleteAgency, { wrapper: withProviders() })
  await act(() => result.current.mutateAsync({ id: AGENCY_ID, name: 'Northwind' }).catch(() => undefined))
  expect(useUiStore.getState().toasts).toEqual([
    expect.objectContaining({ kind: 'error', title: 'Agency not deleted' }),
  ])
  expect(useUiStore.getState().toasts[0]!.body).toContain('deactivate it instead')
})
