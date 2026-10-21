// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { NURSE, json, makeShift, stubApi } from '../../../../tests/fake-api.ts'
import { createTestQueryClient, withProviders } from '../../../../tests/render-with-providers.tsx'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { SESSION_QUERY_KEY } from '../use-session-query/index.ts'
import { useLogout } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

function seededClient() {
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(['shifts', 'list', {}], [makeShift()])
  queryClient.setQueryData(SESSION_QUERY_KEY, NURSE)
  return queryClient
}

it('empties the whole cache after logging out', async () => {
  const fetchMock = stubApi({ 'POST /api/auth/logout': () => json(204) })
  const queryClient = seededClient()
  const { result } = renderHook(useLogout, { wrapper: withProviders({ queryClient }) })

  await act(() => result.current.mutateAsync())

  expect(String(fetchMock.mock.calls[0]![0])).toBe('/api/auth/logout')
  expect(queryClient.getQueryCache().getAll()).toEqual([])
  expect(useUiStore.getState().toasts).toEqual([])
})

it('still empties the cache when the API rejects the sign-out, and says so', async () => {
  stubApi({
    'POST /api/auth/logout': () => json(500, { error: { code: 'internal_error', message: 'Internal server error' } }),
  })
  const queryClient = seededClient()
  const clear = vi.spyOn(queryClient, 'clear')
  const { result } = renderHook(useLogout, { wrapper: withProviders({ queryClient }) })

  await act(() => result.current.mutateAsync().catch(() => undefined))

  expect(clear).toHaveBeenCalledTimes(1)
  expect(queryClient.getQueryCache().getAll()).toEqual([])
  expect(useUiStore.getState().toasts).toEqual([
    expect.objectContaining({ kind: 'error', title: 'Could not sign out' }),
  ])
})

it('still empties the cache when the API cannot be reached', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
  const queryClient = seededClient()
  const { result } = renderHook(useLogout, { wrapper: withProviders({ queryClient }) })

  await act(() => result.current.mutateAsync().catch(() => undefined))

  expect(queryClient.getQueryCache().getAll()).toEqual([])
  expect(useUiStore.getState().toasts.map((toast) => toast.title)).toEqual(['Could not sign out'])
})
