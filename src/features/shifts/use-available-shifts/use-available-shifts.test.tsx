// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../../tests/fake-api.ts'
import { withProviders } from '../../../../tests/render-with-providers.tsx'
import { useAvailableShifts } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('reads open shifts from GET /api/shifts without filters', async () => {
  const shift = makeShift()
  const fetchMock = stubApi({ 'GET /api/shifts': () => json(200, { shifts: [shift] }) })
  const { result } = renderHook(useAvailableShifts, { wrapper: withProviders() })
  await waitFor(() => expect(result.current.data).toEqual([shift]))
  expect(String(fetchMock.mock.calls[0]![0])).toBe('/api/shifts')
})
