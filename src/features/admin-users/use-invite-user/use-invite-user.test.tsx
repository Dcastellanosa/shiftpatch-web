// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { BRANCH_ID, json, makeAdminUser, stubApi } from '../../../../tests/fake-api.ts'
import { createTestQueryClient, withProviders } from '../../../../tests/render-with-providers.tsx'
import { ADMIN_USERS_QUERY_KEY } from '../../../entities/user/queries/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { useInviteUser } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('posts the invitation, refreshes the list and announces it without echoing any link', async () => {
  const invited = makeAdminUser({ status: 'invited', fullName: 'New Nurse', lastSignInAt: null })
  const fetchMock = stubApi({ 'POST /api/admin/users': () => json(201, { user: invited }) })
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const { result } = renderHook(useInviteUser, { wrapper: withProviders({ queryClient }) })

  await act(() =>
    result.current.mutateAsync({
      email: 'new@example.test',
      fullName: 'New Nurse',
      role: 'nurse',
      branchId: BRANCH_ID,
    }),
  )

  expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({
    email: 'new@example.test',
    fullName: 'New Nurse',
    role: 'nurse',
    branchId: BRANCH_ID,
  })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ADMIN_USERS_QUERY_KEY })
  const [toast] = useUiStore.getState().toasts
  expect(toast).toMatchObject({ kind: 'success', title: 'Invitation sent' })
  expect(JSON.stringify(toast)).not.toMatch(/token|http/i)
})

it('surfaces email_exists without a toast', async () => {
  stubApi({
    'POST /api/admin/users': () => json(409, { error: 'An account with this email already exists' }),
  })
  const { result } = renderHook(useInviteUser, { wrapper: withProviders() })
  await act(() =>
    result.current.mutateAsync({ email: 'ava@example.test', fullName: 'Ava', role: 'admin' }).catch(() => undefined),
  )
  await waitFor(() => expect(result.current.error).toMatchObject({ status: 409 }))
  expect(useUiStore.getState().toasts).toEqual([])
})
