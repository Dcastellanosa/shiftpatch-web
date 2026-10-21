// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { json, makeAdminUser, stubApi } from '../../../../tests/fake-api.ts'
import { withProviders } from '../../../../tests/render-with-providers.tsx'
import { ADMIN_USERS_QUERY_KEY, useAdminUsers } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('loads the user list through /api/admin/users', async () => {
  const user = makeAdminUser()
  const fetchMock = stubApi({ 'GET /api/admin/users': () => json(200, { users: [user] }) })
  const { result } = renderHook(useAdminUsers, { wrapper: withProviders() })
  await waitFor(() => expect(result.current.data).toEqual([user]))
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(ADMIN_USERS_QUERY_KEY).toEqual(['admin', 'users'])
})
