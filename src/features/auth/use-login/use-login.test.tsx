// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { NURSE, json, makeShift, stubApi } from '../../../../tests/fake-api.ts'
import { createTestQueryClient, withProviders } from '../../../../tests/render-with-providers.tsx'
import { SESSION_QUERY_KEY } from '../use-session-query/index.ts'
import { useLogin } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

function seededClient() {
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(['shifts', 'list', {}], [makeShift()])
  queryClient.setQueryData(SESSION_QUERY_KEY, null)
  return queryClient
}

it('clears the cache only after a successful login, right before storing the session', async () => {
  stubApi({ 'POST /api/auth/login': () => json(200, { user: NURSE }) })
  const queryClient = seededClient()
  const clear = vi.spyOn(queryClient, 'clear')
  const setQueryData = vi.spyOn(queryClient, 'setQueryData')
  const { result } = renderHook(useLogin, { wrapper: withProviders({ queryClient }) })

  await act(() => result.current.mutateAsync({ email: 'nurse@example.test', password: 'pw' }))

  expect(clear).toHaveBeenCalledTimes(1)
  expect(clear.mock.invocationCallOrder[0]!).toBeLessThan(setQueryData.mock.invocationCallOrder.at(-1)!)
  expect(queryClient.getQueryData(['shifts', 'list', {}])).toBeUndefined()
  expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toEqual(NURSE)
  expect(queryClient.getQueryCache().getAll().map((query) => query.queryKey)).toEqual([SESSION_QUERY_KEY])
})

it('leaves the cache untouched when the credentials are rejected', async () => {
  stubApi({ 'POST /api/auth/login': () => json(401, { error: { code: 'invalid_credentials', message: 'Invalid email or password' } }) })
  const queryClient = seededClient()
  const clear = vi.spyOn(queryClient, 'clear')
  const { result } = renderHook(useLogin, { wrapper: withProviders({ queryClient }) })

  await act(() => result.current.mutateAsync({ email: 'nurse@example.test', password: 'bad' }).catch(() => undefined))

  expect(clear).not.toHaveBeenCalled()
  expect(queryClient.getQueryData(['shifts', 'list', {}])).toHaveLength(1)
  expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull()
  await waitFor(() => expect(result.current.error).toMatchObject({ status: 401, code: 'invalid_credentials' }))
})
