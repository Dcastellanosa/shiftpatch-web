// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { NURSE_ID, json, stubApi } from '../../../../tests/fake-api.ts'
import { createTestQueryClient, withProviders } from '../../../../tests/render-with-providers.tsx'
import { ADMIN_USERS_QUERY_KEY } from '../../../entities/user/queries/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { useDeleteUser } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('sends DELETE and refreshes the user list', async () => {
  const fetchMock = stubApi({ [`DELETE /api/admin/users/${NURSE_ID}`]: () => ({ status: 204 }) })
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const { result } = renderHook(useDeleteUser, { wrapper: withProviders({ queryClient }) })
  await act(() => result.current.mutateAsync({ id: NURSE_ID, fullName: 'Ava Thompson' }))
  expect(fetchMock.mock.calls[0]![1]?.method).toBe('DELETE')
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ADMIN_USERS_QUERY_KEY })
  expect(useUiStore.getState().toasts).toEqual([
    expect.objectContaining({ kind: 'success', title: 'User deleted', body: 'Ava Thompson' }),
  ])
})

it('reports cannot_delete_self as an error toast', async () => {
  stubApi({
    [`DELETE /api/admin/users/${NURSE_ID}`]: () =>
      json(409, { error: { code: 'cannot_delete_self', message: 'You cannot delete your own account' } }),
  })
  const { result } = renderHook(useDeleteUser, { wrapper: withProviders() })
  await act(() => result.current.mutateAsync({ id: NURSE_ID, fullName: 'Me' }).catch(() => undefined))
  expect(useUiStore.getState().toasts).toEqual([expect.objectContaining({ kind: 'error', title: 'User not deleted' })])
})
