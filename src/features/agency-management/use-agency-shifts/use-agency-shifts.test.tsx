// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, stubApi } from '../../../../tests/fake-api.ts'
import { withProviders } from '../../../../tests/render-with-providers.tsx'
import { useAgencyShifts } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('passes the status filter to GET /api/shifts', async () => {
  const fetchMock = stubApi({ 'GET /api/shifts': () => json(200, { shifts: [] }) })
  const { result } = renderHook(() => useAgencyShifts('claimed'), { wrapper: withProviders() })
  await waitFor(() => expect(result.current.data).toEqual([]))
  expect(String(fetchMock.mock.calls[0]![0])).toBe('/api/shifts?status=claimed')
})
