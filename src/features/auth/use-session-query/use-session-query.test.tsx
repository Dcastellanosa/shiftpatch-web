// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { stubApi } from '../../../../tests/fake-api.ts'
import { withProviders } from '../../../../tests/render-with-providers.tsx'
import { SESSION_QUERY_KEY, sessionQueryOptions, useSessionQuery } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('is keyed as ["session"], never goes stale and is never refetched', () => {
  expect(SESSION_QUERY_KEY).toEqual(['session'])
  expect(sessionQueryOptions.queryKey).toEqual(['session'])
  expect(sessionQueryOptions.staleTime).toBe(Infinity)
  expect(sessionQueryOptions.gcTime).toBe(Infinity)
  expect(sessionQueryOptions.refetchOnWindowFocus).toBe(false)
  expect(sessionQueryOptions.refetchOnMount).toBe(false)
  expect(sessionQueryOptions.refetchOnReconnect).toBe(false)
})

it('starts anonymous without asking the server (the token lives only in memory)', () => {
  const fetchMock = stubApi({})
  const { result } = renderHook(useSessionQuery, { wrapper: withProviders() })
  expect(result.current.data).toBeNull()
  expect(result.current.isPending).toBe(false)
  expect(fetchMock).not.toHaveBeenCalled()
})
