import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  API_BASE,
  ApiError,
  activateEligibility,
  apiRequest,
  claimShift,
  completePassword,
  createAgency,
  createBranch,
  createShift,
  deleteAdminUser,
  deleteAgency,
  getAgency,
  getCurrentSession,
  inviteUser,
  listAdminUsers,
  listAgencies,
  listAgencyNurses,
  listBranches,
  listMyShifts,
  listShiftEvents,
  listShifts,
  login,
  logout,
  requestRecovery,
  suspendEligibility,
  updateAgency,
  updateBranch,
  type SessionUser,
} from './index.ts'

const USER: SessionUser = {
  id: 'user-1',
  email: 'nurse@example.com',
  fullName: null,
  role: null,
  agencyId: null,
  agencyIds: [],
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

describe('shift endpoints', () => {
  const SHIFT_ID = '5f0c1d3e-0000-4000-8000-000000000001'

  it('listShifts sends filters as a query string and drops empty values', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { shifts: [] }))
    await listShifts({ status: 'open', branchId: 'b-1', from: undefined, includeAssigned: true })
    expect(lastCall().url).toBe('/api/shifts?status=open&branchId=b-1&includeAssigned=true')
  })

  it('listShifts without filters calls /api/shifts', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { shifts: [] }))
    await expect(listShifts()).resolves.toEqual([])
    expect(lastCall().url).toBe('/api/shifts')
  })

  it('createShift POSTs the shift without any identity fields', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { shift: { id: SHIFT_ID } }))
    const input = { branchId: 'b-1', title: 'ICU', startsAt: '2030-01-01T00:00:00Z', endsAt: '2030-01-01T08:00:00Z' }
    await createShift(input)
    const { url, init } = lastCall()
    expect(url).toBe('/api/shifts')
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual(input)
  })

  it('claimShift POSTs to the claim route with no body', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { shift: { id: SHIFT_ID } }))
    await claimShift(SHIFT_ID)
    const { url, init } = lastCall()
    expect(url).toBe(`/api/shifts/${SHIFT_ID}/claim`)
    expect(init.method).toBe('POST')
    expect(init.body).toBeUndefined()
    expect(init.credentials).toBe('include')
  })

  it('claimShift surfaces rule failures as ApiError', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, { error: { code: 'credential_expired', message: 'Credential expired' } }),
    )
    await expect(claimShift(SHIFT_ID)).rejects.toMatchObject({ status: 422, code: 'credential_expired' })
  })

  it('encodes path segments', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { events: [] }))
    await listShiftEvents('../auth/me')
    expect(lastCall().url).toBe('/api/shifts/..%2Fauth%2Fme/events')
  })

  it('reads My Shifts and branches from their routes', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { upcoming: [], past: [] }))
    await expect(listMyShifts()).resolves.toEqual({ upcoming: [], past: [] })
    expect(lastCall().url).toBe('/api/me/shifts')

    fetchMock.mockResolvedValueOnce(jsonResponse(200, { branches: [] }))
    await expect(listBranches()).resolves.toEqual([])
    expect(lastCall().url).toBe('/api/branches')
  })
})

describe('agency administration endpoints', () => {
  const AGENCY_ID = 'a1000000-0000-4000-8000-000000000001'
  const BRANCH_ID = 'b1000000-0000-4000-8000-000000000001'

  it('lists and reads agencies through /api/admin', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { agencies: [] }))
    await expect(listAgencies()).resolves.toEqual([])
    expect(lastCall().url).toBe('/api/admin/agencies')

    fetchMock.mockResolvedValueOnce(jsonResponse(200, { agency: { id: AGENCY_ID }, branches: [] }))
    await expect(getAgency(AGENCY_ID)).resolves.toEqual({ agency: { id: AGENCY_ID }, branches: [] })
    expect(lastCall().url).toBe(`/api/admin/agencies/${AGENCY_ID}`)
  })

  it('creates and updates agencies with JSON bodies', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { agency: { id: AGENCY_ID } }))
    await createAgency({ name: 'Summit' })
    expect(lastCall().init.method).toBe('POST')
    expect(JSON.parse(String(lastCall().init.body))).toEqual({ name: 'Summit' })

    fetchMock.mockResolvedValueOnce(jsonResponse(200, { agency: { id: AGENCY_ID } }))
    await updateAgency(AGENCY_ID, { status: 'inactive' })
    expect(lastCall().url).toBe(`/api/admin/agencies/${AGENCY_ID}`)
    expect(lastCall().init.method).toBe('PATCH')
    expect(JSON.parse(String(lastCall().init.body))).toEqual({ status: 'inactive' })
  })

  it('creates and updates branches under their agency', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { branch: { id: BRANCH_ID } }))
    await createBranch(AGENCY_ID, { name: 'Up', address: '1 Up', timezone: 'UTC' })
    expect(lastCall().url).toBe(`/api/admin/agencies/${AGENCY_ID}/branches`)
    expect(lastCall().init.method).toBe('POST')

    fetchMock.mockResolvedValueOnce(jsonResponse(200, { branch: { id: BRANCH_ID } }))
    await updateBranch(AGENCY_ID, BRANCH_ID, { status: 'active' })
    expect(lastCall().url).toBe(`/api/admin/agencies/${AGENCY_ID}/branches/${BRANCH_ID}`)
    expect(lastCall().init.method).toBe('PATCH')
    expect(lastCall().init.credentials).toBe('include')
  })
})

describe('user administration endpoints', () => {
  it('lists users and invites one through /api/admin/users', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { users: [] }))
    await expect(listAdminUsers()).resolves.toEqual([])
    expect(lastCall().url).toBe('/api/admin/users')

    fetchMock.mockResolvedValueOnce(jsonResponse(201, { user: { id: 'u-1' } }))
    await inviteUser({ email: 'new@example.test', fullName: 'New Nurse', role: 'nurse', branchId: 'b-1' })
    expect(lastCall().url).toBe('/api/admin/users')
    expect(lastCall().init.method).toBe('POST')
    expect(JSON.parse(String(lastCall().init.body))).toEqual({
      email: 'new@example.test',
      fullName: 'New Nurse',
      role: 'nurse',
      branchId: 'b-1',
    })
  })
})

describe('nurse eligibility endpoints', () => {
  it('lists nurses and toggles eligibility with PUT and DELETE', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { nurses: [] }))
    await expect(listAgencyNurses()).resolves.toEqual([])
    expect(lastCall().url).toBe('/api/agency/nurses')

    const record = { nurseId: 'n-1', branchId: 'b-1', status: 'active', activatedAt: null }
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { eligibility: record }))
    await expect(activateEligibility('n-1', 'b-1')).resolves.toEqual(record)
    expect(lastCall().url).toBe('/api/nurses/n-1/eligibility/b-1')
    expect(lastCall().init.method).toBe('PUT')
    expect(lastCall().init.body).toBeUndefined()

    fetchMock.mockResolvedValueOnce(jsonResponse(200, { eligibility: { ...record, status: 'suspended' } }))
    await suspendEligibility('n-1', 'b-1')
    expect(lastCall().init.method).toBe('DELETE')
    expect(lastCall().init.credentials).toBe('include')
  })
})

describe('password link endpoints', () => {
  it('completes a password with the token in the body only, and returns the session user', async () => {
    const user = { id: 'u-1', email: 'new@example.test', fullName: 'New', role: 'nurse', agencyId: null, agencyIds: [] }
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { user }))
    await expect(
      completePassword({ tokenHash: 'abcdefghijklmnop', type: 'invite', password: 'correct horse battery' }),
    ).resolves.toEqual(user)
    expect(lastCall().url).toBe('/api/auth/complete-password')
    expect(lastCall().init.method).toBe('POST')
    expect(JSON.parse(String(lastCall().init.body))).toEqual({
      tokenHash: 'abcdefghijklmnop',
      type: 'invite',
      password: 'correct horse battery',
    })
    expect(new Headers(lastCall().init.headers).has('authorization')).toBe(false)
  })

  it('requests recovery and treats 204 as success', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await expect(requestRecovery('someone@example.test')).resolves.toBeUndefined()
    expect(lastCall().url).toBe('/api/auth/recover')
    expect(JSON.parse(String(lastCall().init.body))).toEqual({ email: 'someone@example.test' })
  })
})

describe('deletion endpoints', () => {
  it('deletes agencies and users with DELETE and treats 204 as success', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await expect(deleteAgency('a-1')).resolves.toBeUndefined()
    expect(lastCall().url).toBe('/api/admin/agencies/a-1')
    expect(lastCall().init.method).toBe('DELETE')

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await expect(deleteAdminUser('u-1')).resolves.toBeUndefined()
    expect(lastCall().url).toBe('/api/admin/users/u-1')
    expect(lastCall().init.method).toBe('DELETE')
  })
})
