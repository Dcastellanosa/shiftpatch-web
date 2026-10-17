import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  API_BASE,
  ApiError,
  apiRequest,
  getCurrentSession,
  login,
  logout,
  type SessionUser,
} from '../src/lib/api-client.ts'

const USER: SessionUser = {
  id: 'user-1',
  email: 'nurse@example.com',
  fullName: null,
  role: null,
  agencyId: null,
}

const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function lastCall() {
  const [url, init] = fetchMock.mock.calls.at(-1)!
  return { url: String(url), init: init ?? {} }
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api client', () => {
  it('uses the same-origin /api prefix', () => {
    expect(API_BASE).toBe('/api')
  })

  it('getCurrentSession calls GET /api/auth/me with credentials included', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { user: USER }))

    await expect(getCurrentSession()).resolves.toEqual(USER)

    const { url, init } = lastCall()
    expect(url).toBe('/api/auth/me')
    expect(init.credentials).toBe('include')
    expect(init.method ?? 'GET').toBe('GET')
  })

  it('getCurrentSession resolves to null on 401', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, { error: { code: 'unauthenticated', message: 'Authentication required' } }),
    )
    await expect(getCurrentSession()).resolves.toBeNull()
  })

  it('getCurrentSession rethrows non-401 errors', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(503, { error: { code: 'auth_unavailable', message: 'Authentication is not available' } }),
    )
    await expect(getCurrentSession()).rejects.toMatchObject({ status: 503, code: 'auth_unavailable' })
  })

  it('login POSTs JSON credentials to /api/auth/login with credentials included', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { user: USER }))

    await expect(login('nurse@example.com', 'pw')).resolves.toEqual(USER)

    const { url, init } = lastCall()
    expect(url).toBe('/api/auth/login')
    expect(init.method).toBe('POST')
    expect(init.credentials).toBe('include')
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json')
    expect(JSON.parse(String(init.body))).toEqual({ email: 'nurse@example.com', password: 'pw' })
  })

  it('login surfaces the API error code and message', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, { error: { code: 'invalid_credentials', message: 'Invalid email or password' } }),
    )

    const error = await login('nurse@example.com', 'bad').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 401, code: 'invalid_credentials', message: 'Invalid email or password' })
  })

  it('logout POSTs to /api/auth/logout and accepts 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(logout()).resolves.toBeUndefined()

    const { url, init } = lastCall()
    expect(url).toBe('/api/auth/logout')
    expect(init.method).toBe('POST')
    expect(init.credentials).toBe('include')
  })

  it('maps non-JSON error responses to a generic ApiError', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }))
    await expect(apiRequest('/health')).rejects.toMatchObject({ status: 502, code: 'http_error' })
  })

  it('maps network failures to ApiError network_error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(apiRequest('/health')).rejects.toMatchObject({ status: 0, code: 'network_error' })
  })

  it.each(['https://evil.example/auth/me', '//evil.example/auth/me', 'auth/me'])(
    'refuses non-relative path %s',
    async (path) => {
      await expect(apiRequest(path)).rejects.toThrow(/must be relative/)
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )

  it('never sends an Authorization header', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { user: USER }))
    await getCurrentSession()
    expect(new Headers(lastCall().init.headers).has('Authorization')).toBe(false)
  })
})
