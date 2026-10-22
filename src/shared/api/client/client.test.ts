import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearAccessToken, hasAccessToken, onSessionLost, setAccessToken } from '../token/index.ts'
import {
  API_BASE,
  ApiError,
  activateEligibility,
  apiRequest,
  cancelShift,
  claimShift,
  completePassword,
  createAgency,
  createBranch,
  createShift,
  deleteAdminUser,
  deleteAgency,
  getAgency,
  inviteUser,
  listAdminUsers,
  listAgencies,
  listAgencyNurses,
  listAgencyShifts,
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

const USER: SessionUser = { id: 'nurse-1', name: 'Maria Lopez', role: 'nurse' }
const TOKEN = 'eyJ.test.token'

const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function lastCall() {
  const [url, init] = fetchMock.mock.calls.at(-1)!
  return { url: String(url), init: init ?? {} }
}

const authHeader = () => new Headers(lastCall().init.headers).get('Authorization')

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  clearAccessToken()
  vi.unstubAllGlobals()
})

describe('api client', () => {
  it('uses the same-origin /api prefix', () => {
    expect(API_BASE).toBe('/api')
  })

  it('sends no Authorization header and no cookies before login', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { shifts: [] }))
    await listShifts()
    const { init } = lastCall()
    expect(new Headers(init.headers).has('Authorization')).toBe(false)
    expect(init.credentials).toBe('omit')
  })

  it('login POSTs JSON credentials, keeps the token in memory and returns only the user', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { token: TOKEN, user: USER }))

    await expect(login('maria.lopez@example.com', 'pw')).resolves.toEqual(USER)

    const { url, init } = lastCall()
    expect(url).toBe('/api/auth/login')
    expect(init.method).toBe('POST')
    expect(init.credentials).toBe('omit')
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json')
    expect(JSON.parse(String(init.body))).toEqual({ email: 'maria.lopez@example.com', password: 'pw' })
    expect(hasAccessToken()).toBe(true)
  })

  it('sends the token as Authorization: Bearer on every later request', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { token: TOKEN, user: USER }))
    await login('maria.lopez@example.com', 'pw')
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { shifts: [] }))
    await listShifts()
    expect(authHeader()).toBe(`Bearer ${TOKEN}`)
    expect(lastCall().init.credentials).toBe('omit')
  })

  it('login surfaces the API error message with a status-derived code', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { error: 'Invalid email or password' }))

    const error = await login('maria.lopez@example.com', 'bad').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 401, message: 'Invalid email or password' })
    expect(hasAccessToken()).toBe(false)
  })

  it('a 401 on login does not count as a lost session', async () => {
    const lost = vi.fn()
    const stop = onSessionLost(lost)
    setAccessToken(TOKEN)
    fetchMock.mockResolvedValue(jsonResponse(401, { error: 'Invalid email or password' }))
    await login('maria.lopez@example.com', 'bad').catch(() => undefined)
    expect(lost).not.toHaveBeenCalled()
    expect(hasAccessToken()).toBe(true)
    stop()
  })

  it('a 401 on any protected request drops the token and notifies the session-lost listener', async () => {
    const lost = vi.fn()
    const stop = onSessionLost(lost)
    setAccessToken(TOKEN)
    fetchMock.mockResolvedValue(jsonResponse(401, { error: 'Invalid or expired token' }))
    await expect(listShifts()).rejects.toMatchObject({ status: 401, message: 'Invalid or expired token' })
    expect(hasAccessToken()).toBe(false)
    expect(lost).toHaveBeenCalledTimes(1)
    stop()
  })

  it('logout POSTs to /api/auth/logout with the token, accepts 204 and forgets the token', async () => {
    setAccessToken(TOKEN)
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(logout()).resolves.toBeUndefined()

    const { url, init } = lastCall()
    expect(url).toBe('/api/auth/logout')
    expect(init.method).toBe('POST')
    expect(authHeader()).toBe(`Bearer ${TOKEN}`)
    expect(hasAccessToken()).toBe(false)
  })

  it('logout forgets the token even when the API fails', async () => {
    setAccessToken(TOKEN)
    fetchMock.mockResolvedValue(jsonResponse(500, { error: 'Internal server error' }))
    await expect(logout()).rejects.toMatchObject({ status: 500 })
    expect(hasAccessToken()).toBe(false)
  })

  it('maps non-JSON error responses to a generic ApiError', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }))
    await expect(apiRequest('/health')).rejects.toMatchObject({ status: 502 })
  })

  it.each([
    [400, 'validation_error'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [413, 'payload_too_large'],
    [422, 'validation_error'],
    [503, 'http_error'],
  ])('derives code %s from status %i of the one-key envelope', async (status, code) => {
    fetchMock.mockResolvedValue(jsonResponse(status, { error: 'Something specific' }))
    await expect(apiRequest('/health')).rejects.toMatchObject({ status, code, message: 'Something specific' })
  })

  it('maps network failures to ApiError network_error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(apiRequest('/health')).rejects.toMatchObject({ status: 0 })
  })

  it.each(['https://evil.example/auth/me', '//evil.example/auth/me', 'auth/me'])(
    'refuses non-relative path %s',
    async (path) => {
      await expect(apiRequest(path)).rejects.toThrow(/must be relative/)
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )

  it('sends FormData bodies without a JSON content type', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, {}))
    const body = new FormData()
    body.append('expiresAt', '2028-01-01')
    await apiRequest('/me/credentials', { method: 'POST', body })
    const { init } = lastCall()
    expect(new Headers(init.headers).has('Content-Type')).toBe(false)
    expect(init.body).toBe(body)
  })
})

describe('shift endpoints', () => {
  const SHIFT = {
    id: 'shift-1',
    agencyId: 'agency-a',
    agencyName: 'Sunrise Health Staffing',
    role: 'RN',
    date: '2026-10-02',
    startTime: '19:00',
    endTime: '07:00',
    status: 'open',
    claimedBy: null,
  }

  it('listShifts reads the marketplace from /api/shifts', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { shifts: [SHIFT] }))
    await expect(listShifts()).resolves.toEqual([SHIFT])
    expect(lastCall().url).toBe('/api/shifts')
  })

  it('listAgencyShifts reads one agency’s shifts', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { agencyId: 'agency-a', shifts: [SHIFT] }))
    await expect(listAgencyShifts('agency-a')).resolves.toEqual([SHIFT])
    expect(lastCall().url).toBe('/api/agencies/agency-a/shifts')
  })

  it('createShift POSTs the contract body only and returns the bare shift', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, SHIFT))
    const input = { role: 'RN', date: '2026-10-05', startTime: '07:00', endTime: '19:00' }
    await expect(createShift(input)).resolves.toEqual(SHIFT)
    const { url, init } = lastCall()
    expect(url).toBe('/api/shifts')
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual(input)
  })

  it('createShift forwards a branch when given one', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, SHIFT))
    await createShift({ role: 'RN', date: '2026-10-05', startTime: '07:00', endTime: '19:00', branchId: 'b-1' })
    expect(JSON.parse(String(lastCall().init.body))).toEqual({
      role: 'RN',
      date: '2026-10-05',
      startTime: '07:00',
      endTime: '19:00',
      branchId: 'b-1',
    })
  })

  it('claimShift POSTs to the claim route with no body and returns the bare shift', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ...SHIFT, status: 'filled', claimedBy: 'nurse-1' }))
    await expect(claimShift('shift-1')).resolves.toMatchObject({ status: 'filled', claimedBy: 'nurse-1' })
    const { url, init } = lastCall()
    expect(url).toBe('/api/shifts/shift-1/claim')
    expect(init.method).toBe('POST')
    expect(init.body).toBeUndefined()
  })

  it('claimShift surfaces the contract message for a credential failure', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, { error: 'Credential expired, cannot claim shift' }))
    await expect(claimShift('shift-3')).rejects.toMatchObject({
      status: 403,
      message: 'Credential expired, cannot claim shift',
    })
  })

  it('cancelShift POSTs the reason and returns the reopened shift', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { ...SHIFT, id: 'shift-2', cancellation: { reason: 'no-show', previousNurseId: 'nurse-1' } }),
    )
    await expect(cancelShift('shift-2', 'no-show')).resolves.toMatchObject({ id: 'shift-2', status: 'open' })
    const { url, init } = lastCall()
    expect(url).toBe('/api/shifts/shift-2/cancel')
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({ reason: 'no-show' })
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
  const AGENCY_ID = 'agency-a'
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
  })
})

describe('password link endpoints', () => {
  it('completes a password with the token hash in the body only, stores the session token and returns the user', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { token: TOKEN, user: USER }))
    await expect(
      completePassword({ tokenHash: 'abcdefghijklmnop', type: 'invite', password: 'correct horse battery' }),
    ).resolves.toEqual(USER)
    expect(lastCall().url).toBe('/api/auth/complete-password')
    expect(lastCall().init.method).toBe('POST')
    expect(JSON.parse(String(lastCall().init.body))).toEqual({
      tokenHash: 'abcdefghijklmnop',
      type: 'invite',
      password: 'correct horse battery',
    })
    expect(new Headers(lastCall().init.headers).has('authorization')).toBe(false)
    expect(hasAccessToken()).toBe(true)

    fetchMock.mockResolvedValueOnce(jsonResponse(200, { shifts: [] }))
    await listShifts()
    expect(authHeader()).toBe(`Bearer ${TOKEN}`)
  })

  it('a rejected link does not count as a lost session', async () => {
    const lost = vi.fn()
    const stop = onSessionLost(lost)
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { error: 'This link is invalid or has expired.' }))
    await completePassword({ tokenHash: 'abcdefghijklmnop', type: 'invite', password: 'x'.repeat(12) }).catch(
      () => undefined,
    )
    expect(lost).not.toHaveBeenCalled()
    stop()
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
