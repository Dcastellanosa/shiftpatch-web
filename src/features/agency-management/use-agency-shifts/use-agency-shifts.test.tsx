// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeShift, stubApi } from '../../../../tests/fake-api.ts'
import { withProviders } from '../../../../tests/render-with-providers.tsx'
import { useAgencyShifts } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('reads the agency’s own shifts from GET /api/agencies/:agencyId/shifts', async () => {
  const shift = makeShift()
  const fetchMock = stubApi({
    'GET /api/agencies/agency-a/shifts': () => json(200, { agencyId: 'agency-a', shifts: [shift] }),
  })
  const { result } = renderHook(() => useAgencyShifts('agency-a'), { wrapper: withProviders() })
  await waitFor(() => expect(result.current.data).toEqual([shift]))
  expect(String(fetchMock.mock.calls[0]![0])).toBe('/api/agencies/agency-a/shifts')
})

it('waits until the agency id is known', () => {
  const fetchMock = stubApi({})
  const { result } = renderHook(() => useAgencyShifts(''), { wrapper: withProviders() })
  expect(result.current.fetchStatus).toBe('idle')
  expect(fetchMock).not.toHaveBeenCalled()
})
