// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeNurseEligibility, stubApi } from '../../../../tests/fake-api.ts'
import { withProviders } from '../../../../tests/render-with-providers.tsx'
import { AGENCY_NURSES_QUERY_KEY, useAgencyNurses } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('loads the nurses through /api/agency/nurses', async () => {
  const nurse = makeNurseEligibility()
  stubApi({ 'GET /api/agency/nurses': () => json(200, { nurses: [nurse] }) })
  const { result } = renderHook(useAgencyNurses, { wrapper: withProviders() })
  await waitFor(() => expect(result.current.data).toEqual([nurse]))
  expect(AGENCY_NURSES_QUERY_KEY).toEqual(['agency', 'nurses'])
})
