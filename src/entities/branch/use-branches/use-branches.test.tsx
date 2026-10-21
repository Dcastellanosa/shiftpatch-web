// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, stubApi } from '../../../../tests/fake-api.ts'
import { withProviders } from '../../../../tests/render-with-providers.tsx'
import { useBranches } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('reads branches from GET /api/branches', async () => {
  const fetchMock = stubApi({ 'GET /api/branches': () => json(200, { branches: [] }) })
  const { result } = renderHook(useBranches, { wrapper: withProviders() })
  await waitFor(() => expect(result.current.data).toEqual([]))
  expect(String(fetchMock.mock.calls[0]![0])).toBe('/api/branches')
})
