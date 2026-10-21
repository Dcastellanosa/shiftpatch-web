// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { NURSE, json, stubApi } from '../../../../tests/fake-api.ts'
import { createTestQueryClient, withProviders } from '../../../../tests/render-with-providers.tsx'
import { useSession } from '../session-context/index.ts'
import { SESSION_QUERY_KEY } from '../use-session-query/index.ts'
import { useCompletePassword } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

const input = { tokenHash: 'pkce_0123456789abcdef', type: 'invite' as const, password: 'correct horse battery' }
const unauthenticated = () => json(401, { error: { code: 'unauthenticated', message: 'Authentication required' } })

it('stores the new session only after the API accepted the password, and the session provider sees it', async () => {
  stubApi({ 'GET /api/auth/me': unauthenticated, 'POST /api/auth/complete-password': () => json(200, { user: NURSE }) })
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(['shifts', 'list', {}], [])
  const { result } = renderHook(() => ({ complete: useCompletePassword(), session: useSession() }), {
    wrapper: withProviders({ session: true, queryClient }),
  })
  await waitFor(() => expect(result.current.session.loading).toBe(false))
  expect(result.current.session.authenticated).toBe(false)

  await act(() => result.current.complete.mutateAsync(input))

  await waitFor(() => expect(result.current.session.authenticated).toBe(true))
  expect(result.current.session.user).toEqual(NURSE)
  expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toEqual(NURSE)
  expect(queryClient.getQueryData(['shifts', 'list', {}])).toBeUndefined()
})

it('leaves the cache untouched when the link is rejected', async () => {
  stubApi({ 'POST /api/auth/complete-password': () => json(401, { error: { code: 'invalid_or_expired_link', message: 'This link is invalid or has expired. Request a new one.' } }) })
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(['shifts', 'list', {}], [])
  const { result } = renderHook(useCompletePassword, { wrapper: withProviders({ queryClient }) })
  await act(() => result.current.mutateAsync(input).catch(() => undefined))
  await waitFor(() => expect(result.current.error).toMatchObject({ status: 401, code: 'invalid_or_expired_link' }))
  expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeUndefined()
  expect(queryClient.getQueryData(['shifts', 'list', {}])).toEqual([])
})
