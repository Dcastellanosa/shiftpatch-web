// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, stubApi } from '../../../../tests/fake-api.ts'
import { withProviders } from '../../../../tests/render-with-providers.tsx'
import { useMyShifts } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('reads My Shifts from GET /api/me/shifts', async () => {
  const fetchMock = stubApi({ 'GET /api/me/shifts': () => json(200, { upcoming: [], past: [] }) })
  const { result } = renderHook(useMyShifts, { wrapper: withProviders() })
  await waitFor(() => expect(result.current.data).toEqual({ upcoming: [], past: [] }))
  expect(String(fetchMock.mock.calls[0]![0])).toBe('/api/me/shifts')
})
