// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AGENCY_ID, json, makeAgency, makeAgencyBranch, stubApi } from '../../../../tests/fake-api.ts'
import { withProviders } from '../../../../tests/render-with-providers.tsx'
import { agencyKeys, useAgencies, useAgency } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('nests every agency key under the shared prefix', () => {
  expect(agencyKeys.list()).toEqual(['agencies', 'list'])
  expect(agencyKeys.detail(AGENCY_ID)).toEqual(['agencies', AGENCY_ID])
  expect(agencyKeys.detail(AGENCY_ID)[0]).toBe(agencyKeys.all[0])
})

it('loads the list and one detail through /api/admin', async () => {
  const agency = makeAgency()
  const fetchMock = stubApi({
    'GET /api/admin/agencies': () => json(200, { agencies: [agency] }),
    [`GET /api/admin/agencies/${AGENCY_ID}`]: () => json(200, { agency, branches: [makeAgencyBranch()] }),
  })
  const list = renderHook(useAgencies, { wrapper: withProviders() })
  await waitFor(() => expect(list.result.current.data).toEqual([agency]))
  const detail = renderHook(() => useAgency(AGENCY_ID), { wrapper: withProviders() })
  await waitFor(() => expect(detail.result.current.data?.branches).toHaveLength(1))
  expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
    '/api/admin/agencies',
    `/api/admin/agencies/${AGENCY_ID}`,
  ])
})
