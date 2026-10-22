// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../../tests/fake-api.ts'
import { withProviders } from '../../../../tests/render-with-providers.tsx'
import { useAvailableShifts } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('reads the marketplace from GET /api/shifts and keeps only open shifts', async () => {
  const open = makeShift()
  const filled = makeShift({ id: 'shift-2', status: 'filled', claimedBy: 'nurse-1' })
  const fetchMock = stubApi({ 'GET /api/shifts': () => json(200, { shifts: [filled, open] }) })
  const { result } = renderHook(useAvailableShifts, { wrapper: withProviders() })
  await waitFor(() => expect(result.current.data).toEqual([open]))
  expect(String(fetchMock.mock.calls[0]![0])).toBe('/api/shifts')
})
