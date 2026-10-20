// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useAsync } from './use-async.ts'

it('loads on mount and reloads on request', async () => {
  const load = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')
  const { result } = renderHook(() => useAsync(load, 'example'))
  expect(result.current.loading).toBe(true)
  await waitFor(() => expect(result.current.data).toBe('first'))
  act(() => result.current.reload())
  await waitFor(() => expect(result.current.data).toBe('second'))
  expect(load).toHaveBeenCalledTimes(2)
})
