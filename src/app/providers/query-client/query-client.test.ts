import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api/client/index.ts'
import { MAX_NETWORK_RETRIES, OPERATIONAL_STALE_TIME, createQueryClient, retryNetworkFailuresOnly } from './index.ts'

describe('retry policy', () => {
  it('retries network failures at most twice', () => {
    const network = new ApiError(0, 'network_error', 'Unable to reach the server')
    expect(retryNetworkFailuresOnly(0, network)).toBe(true)
    expect(retryNetworkFailuresOnly(1, network)).toBe(true)
    expect(retryNetworkFailuresOnly(MAX_NETWORK_RETRIES, network)).toBe(false)
  })

  it('never retries HTTP errors or unknown failures', () => {
    expect(retryNetworkFailuresOnly(0, new ApiError(500, 'internal_error', 'Internal server error'))).toBe(false)
    expect(retryNetworkFailuresOnly(0, new ApiError(401, 'unauthenticated', 'Authentication required'))).toBe(false)
    expect(retryNetworkFailuresOnly(0, new Error('boom'))).toBe(false)
  })
})

describe('createQueryClient', () => {
  it('keeps operational data fresh for 30 seconds and uses the network-only retry policy', () => {
    const { queries, mutations } = createQueryClient().getDefaultOptions()
    expect(queries?.staleTime).toBe(OPERATIONAL_STALE_TIME)
    expect(queries?.staleTime).toBe(30_000)
    expect(queries?.retry).toBe(retryNetworkFailuresOnly)
    expect(mutations?.retry).toBe(false)
  })

  it('disables retries when asked (test clients)', () => {
    expect(createQueryClient({ retry: false }).getDefaultOptions().queries?.retry).toBe(false)
  })

  it('reports only background refresh failures', async () => {
    const onBackgroundError = vi.fn()
    const client = createQueryClient({ retry: false, onBackgroundError })
    const failing = () => Promise.reject(new ApiError(500, 'internal_error', 'Internal server error'))

    await client.fetchQuery({ queryKey: ['first-load'], queryFn: failing }).catch(() => undefined)
    expect(onBackgroundError).not.toHaveBeenCalled()

    client.setQueryData(['refresh'], ['stale rows'])
    await client.fetchQuery({ queryKey: ['refresh'], queryFn: failing, staleTime: 0 }).catch(() => undefined)
    expect(onBackgroundError).toHaveBeenCalledWith(expect.objectContaining({ status: 500, code: 'internal_error' }))
    expect(client.getQueryData(['refresh'])).toEqual(['stale rows'])
  })
})
