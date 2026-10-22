// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeAgency, stubApi } from '../../../../tests/fake-api.ts'
import { createTestQueryClient, withProviders } from '../../../../tests/render-with-providers.tsx'
import { agencyKeys } from '../../../entities/agency/queries/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { useCreateAgency } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('creates the agency, refreshes agency data and announces it', async () => {
  const agency = makeAgency({ name: 'Summit Nursing', branchCount: 0 })
  const fetchMock = stubApi({ 'POST /api/admin/agencies': () => json(201, { agency }) })
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const { result } = renderHook(useCreateAgency, { wrapper: withProviders({ queryClient }) })

  await act(() => result.current.mutateAsync({ name: 'Summit Nursing' }))

  expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({ name: 'Summit Nursing' })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: agencyKeys.all })
  expect(useUiStore.getState().toasts).toEqual([expect.objectContaining({ kind: 'success', title: 'Agency created' })])
})

it('surfaces name_taken without a toast', async () => {
  stubApi({
    'POST /api/admin/agencies': () => json(409, { error: 'An agency with this name already exists' }),
  })
  const { result } = renderHook(useCreateAgency, { wrapper: withProviders() })
  await act(() => result.current.mutateAsync({ name: 'Northwind' }).catch(() => undefined))
  await waitFor(() => expect(result.current.error).toMatchObject({ status: 409 }))
  expect(useUiStore.getState().toasts).toEqual([])
})
