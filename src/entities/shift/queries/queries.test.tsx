// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, stubApi } from '../../../../tests/fake-api.ts'
import { withProviders } from '../../../../tests/render-with-providers.tsx'
import { MY_SHIFTS_QUERY_KEY, shiftKeys, useShiftEvents } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('nests every shift key under the shared prefix', () => {
  expect(shiftKeys.list()).toEqual(['shifts', 'list'])
  expect(shiftKeys.agency('agency-a')).toEqual(['shifts', 'agency', 'agency-a'])
  expect(shiftKeys.events('s-1')).toEqual(['shifts', 's-1', 'events'])
  expect(shiftKeys.list()[0]).toBe(shiftKeys.all[0])
  expect(shiftKeys.agency('agency-a')[0]).toBe(shiftKeys.all[0])
  expect(MY_SHIFTS_QUERY_KEY).toEqual(['me', 'shifts'])
})

it('loads the events of one shift', async () => {
  const fetchMock = stubApi({ 'GET /api/shifts/s-1/events': () => json(200, { events: [] }) })
  const { result } = renderHook(() => useShiftEvents('s-1'), { wrapper: withProviders() })
  await waitFor(() => expect(result.current.data).toEqual([]))
  expect(String(fetchMock.mock.calls[0]![0])).toBe('/api/shifts/s-1/events')
})
