// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { NURSE, json, stubApi } from '../../../../tests/fake-api.ts'
import { withProviders } from '../../../../tests/render-with-providers.tsx'
import { SESSION_QUERY_KEY, sessionQueryOptions, useSessionQuery } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('is keyed as ["session"], never goes stale and ignores window focus', () => {
  expect(SESSION_QUERY_KEY).toEqual(['session'])
  expect(sessionQueryOptions.queryKey).toEqual(['session'])
  expect(sessionQueryOptions.staleTime).toBe(Infinity)
  expect(sessionQueryOptions.refetchOnWindowFocus).toBe(false)
})

it('reads the session once from GET /api/auth/me', async () => {
  const fetchMock = stubApi({ 'GET /api/auth/me': () => json(200, { user: NURSE }) })
  const { result, rerender } = renderHook(useSessionQuery, { wrapper: withProviders() })
  await waitFor(() => expect(result.current.data).toEqual(NURSE))
  rerender()
  expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(['/api/auth/me'])
})

it('resolves to null when the API reports no session', async () => {
  stubApi({ 'GET /api/auth/me': () => json(401, { error: { code: 'unauthenticated', message: 'Authentication required' } }) })
  const { result } = renderHook(useSessionQuery, { wrapper: withProviders() })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toBeNull()
})
