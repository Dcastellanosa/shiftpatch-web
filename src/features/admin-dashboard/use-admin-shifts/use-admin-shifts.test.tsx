// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../../tests/fake-api.ts'
import { withProviders } from '../../../../tests/render-with-providers.tsx'
import { useAdminShifts, type AdminShiftFilters } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('sends branch and date filters and keeps the previous rows while a new filter loads', async () => {
  const shift = makeShift()
  const fetchMock = stubApi({ 'GET /api/shifts': () => json(200, { shifts: [shift] }) })
  const { result, rerender } = renderHook((filters: AdminShiftFilters) => useAdminShifts(filters), {
    wrapper: withProviders(),
    initialProps: {},
  })
  await waitFor(() => expect(result.current.data).toEqual([shift]))

  rerender({ branchId: 'branch-1', from: '2030-01-01T00:00:00Z', to: '2030-02-01T00:00:00Z' })
  expect(result.current.data).toEqual([shift])
  expect(result.current.isPlaceholderData).toBe(true)
  await waitFor(() => expect(result.current.isPlaceholderData).toBe(false))
  expect(String(fetchMock.mock.calls[1]![0])).toBe(
    '/api/shifts?branchId=branch-1&from=2030-01-01T00%3A00%3A00Z&to=2030-02-01T00%3A00%3A00Z',
  )
})
