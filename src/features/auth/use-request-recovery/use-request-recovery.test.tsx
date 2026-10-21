// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { stubApi } from '../../../../tests/fake-api.ts'
import { withProviders } from '../../../../tests/render-with-providers.tsx'
import { useRequestRecovery } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

it('posts the email and resolves on 204', async () => {
  const fetchMock = stubApi({ 'POST /api/auth/recover': () => ({ status: 204 }) })
  const { result } = renderHook(useRequestRecovery, { wrapper: withProviders() })
  await act(() => result.current.mutateAsync('someone@example.test'))
  expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({ email: 'someone@example.test' })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
})
