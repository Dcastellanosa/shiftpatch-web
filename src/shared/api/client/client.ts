/**
 * The frontend's only gateway to backend data. Every request goes to the
 * same-origin `/api` prefix, which the Vite dev server (locally) or Vercel
 * (deployed) proxies to shiftpatch-api. Authentication is a bearer token the
 * API returned at sign-in: it lives only in the in-memory holder next door
 * (`../token`) and travels only as the `Authorization` header built here.
 * No cookies are ever sent (`credentials: 'omit'`).
 */
import { authorizationHeaders, clearAccessToken, notifySessionLost, setAccessToken } from '../token/token.ts'

export const API_BASE = '/api'

export type UserRole = 'agency' | 'nurse' | 'admin'

/** The user as `POST /api/auth/login` reports it: the public id (`nurse-1`, or `agency-a` for agency logins), a display name and the role. */
export interface SessionUser {
  id: string
  name: string
  /** `null` only for an account that has no ShiftPatch profile yet. */
  role: UserRole | null
}

/** A sign-in response. The token goes straight to the holder and never further. */
interface AuthPayload {
  token: string
  user: SessionUser
}

export class ApiError extends Error {
  readonly status: number
  /** Derived from the status: the API's envelope carries only a message. */
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/** The API's error envelope: exactly `{ "error": "<message>" }`. */
interface ErrorBody {
  error: string
}

function isErrorBody(value: unknown): value is ErrorBody {
  return typeof value === 'object' && value !== null && typeof (value as { error?: unknown }).error === 'string'
}

const CODE_BY_STATUS: Record<number, string> = {
  400: 'validation_error',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  413: 'payload_too_large',
  422: 'validation_error',
}

const codeFor = (status: number) => CODE_BY_STATUS[status] ?? 'http_error'

/** Routes whose 401 means "bad credentials or link", never "your session is gone". */
const PUBLIC_PATHS = new Set(['/auth/login', '/auth/complete-password', '/auth/recover'])

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error(`API paths must be relative to ${API_BASE} and start with "/": ${path}`)
  }

  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  for (const [name, value] of Object.entries(authorizationHeaders())) headers.set(name, value)
  // A FormData body carries its own multipart content type (with the boundary the browser picks).
  if (init.body !== undefined && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'omit' })
  } catch {
    throw new ApiError(0, 'network_error', 'Unable to reach the server')
  }

  if (response.status === 401 && !PUBLIC_PATHS.has(path.split('?')[0]!)) {
    // The token was rejected (expired or revoked): forget it and let the app sign out.
    clearAccessToken()
    notifySessionLost()
  }

  const body = await readJson(response)
  if (!response.ok) {
    if (isErrorBody(body)) throw new ApiError(response.status, codeFor(response.status), body.error)
    throw new ApiError(response.status, 'http_error', `Request failed with status ${response.status}`)
  }
  return body as T
}

/** Signs in. The token is stored in memory only; callers get the user. */
export async function login(email: string, password: string): Promise<SessionUser> {
  const { token, user } = await apiRequest<AuthPayload>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setAccessToken(token)
  return user
}

/** Revokes the token at the API (best effort) and always forgets it locally. */
export async function logout(): Promise<void> {
  try {
    await apiRequest<void>('/auth/logout', { method: 'POST' })
  } finally {
    clearAccessToken()
  }
}

// ---------------------------------------------------------------------------
// Shifts: the contract's flat shape, exactly as the API returns it.
// ---------------------------------------------------------------------------

/** `filled` is the public word for a claimed shift. */
export type ShiftStatus = 'open' | 'filled'
export type ShiftEventType = 'created' | 'claimed' | 'cancelled' | 'completed' | 'no_show'
export type CancellationReason = 'no-show' | 'advance'

export interface Shift {
  /** Public id, e.g. `shift-1`. */
  id: string
  /** Public agency id, e.g. `agency-a`. */
  agencyId: string
  agencyName: string
  /** RN, LPN, ... */
  role: string
  /** Facility-local date, YYYY-MM-DD. */
  date: string
  /** Facility-local HH:MM. `endTime` at or before `startTime` means the next day. */
  startTime: string
  endTime: string
  status: ShiftStatus
  /** Public id of the nurse holding the shift, or null while open. */
  claimedBy: string | null
}

export interface ShiftEvent {
  id: string
  eventType: ShiftEventType
  previousStatus: string | null
  newStatus: string
  reason: string | null
  occurredAt: string
  actor: { id: string; fullName: string | null }
}

export type EntityStatus = 'active' | 'inactive'

export interface Branch {
  id: string
  name: string
  address: string
  timezone: string
  status: EntityStatus
  agency: { id: string; name: string }
}

/** The contract body of `POST /api/shifts`; `branchId` only when the agency has several branches. */
export interface CreateShiftInput {
  role: string
  date: string
  startTime: string
  endTime: string
  branchId?: string
}

const shiftPath = (shiftId: string) => `/shifts/${encodeURIComponent(shiftId)}`

/** The marketplace: every shift of every agency. */
export async function listShifts(): Promise<Shift[]> {
  const { shifts } = await apiRequest<{ shifts: Shift[] }>('/shifts')
  return shifts
}

/** One agency's own shifts (the agency user's, or any for an admin). */
export async function listAgencyShifts(agencyId: string): Promise<Shift[]> {
  const { shifts } = await apiRequest<{ agencyId: string; shifts: Shift[] }>(
    `/agencies/${encodeURIComponent(agencyId)}/shifts`,
  )
  return shifts
}

export async function createShift(input: CreateShiftInput): Promise<Shift> {
  return apiRequest<Shift>('/shifts', { method: 'POST', body: JSON.stringify(input) })
}

/** Claims a shift for the signed-in nurse. Rule failures reject with an `ApiError` carrying the API's message. */
export async function claimShift(shiftId: string): Promise<Shift> {
  return apiRequest<Shift>(`${shiftPath(shiftId)}/claim`, { method: 'POST' })
}

/** Releases a filled shift (no-show or advance cancellation); it reopens. */
export async function cancelShift(shiftId: string, reason: CancellationReason): Promise<Shift> {
  return apiRequest<Shift>(`${shiftPath(shiftId)}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) })
}

export async function listShiftEvents(shiftId: string): Promise<ShiftEvent[]> {
  const { events } = await apiRequest<{ events: ShiftEvent[] }>(`${shiftPath(shiftId)}/events`)
  return events
}

export async function listMyShifts(): Promise<{ upcoming: Shift[]; past: Shift[] }> {
  return apiRequest<{ upcoming: Shift[]; past: Shift[] }>('/me/shifts')
}

export async function listBranches(): Promise<Branch[]> {
  const { branches } = await apiRequest<{ branches: Branch[] }>('/branches')
  return branches
}

// ---------------------------------------------------------------------------
// Agency administration (admin only). Shapes mirror the API's admin schemas.
// ---------------------------------------------------------------------------

export interface Agency {
  id: string
  name: string
  status: EntityStatus
  branchCount: number
  createdAt: string
  updatedAt: string
}

export interface AgencyBranch {
  id: string
  agencyId: string
  name: string
  address: string
  timezone: string
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

export interface AgencyDetail {
  agency: Agency
  branches: AgencyBranch[]
}

export interface CreateAgencyInput {
  name: string
}

export interface UpdateAgencyInput {
  name?: string
  status?: EntityStatus
}

export interface CreateBranchInput {
  name: string
  address: string
  timezone: string
}

export interface UpdateBranchInput {
  name?: string
  address?: string
  timezone?: string
  status?: EntityStatus
}

const agencyPath = (agencyId: string) => `/admin/agencies/${encodeURIComponent(agencyId)}`

export async function listAgencies(): Promise<Agency[]> {
  const { agencies } = await apiRequest<{ agencies: Agency[] }>('/admin/agencies')
  return agencies
}

export async function getAgency(agencyId: string): Promise<AgencyDetail> {
  return apiRequest<AgencyDetail>(agencyPath(agencyId))
}

export async function createAgency(input: CreateAgencyInput): Promise<Agency> {
  const { agency } = await apiRequest<{ agency: Agency }>('/admin/agencies', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return agency
}

export async function updateAgency(agencyId: string, input: UpdateAgencyInput): Promise<Agency> {
  const { agency } = await apiRequest<{ agency: Agency }>(agencyPath(agencyId), {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return agency
}

export async function createBranch(agencyId: string, input: CreateBranchInput): Promise<AgencyBranch> {
  const { branch } = await apiRequest<{ branch: AgencyBranch }>(`${agencyPath(agencyId)}/branches`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return branch
}

export async function updateBranch(
  agencyId: string,
  branchId: string,
  input: UpdateBranchInput,
): Promise<AgencyBranch> {
  const { branch } = await apiRequest<{ branch: AgencyBranch }>(
    `${agencyPath(agencyId)}/branches/${encodeURIComponent(branchId)}`,
    { method: 'PATCH', body: JSON.stringify(input) },
  )
  return branch
}

// ---------------------------------------------------------------------------
// User administration (admin only).
// ---------------------------------------------------------------------------

export type EligibilityStatus = 'pending' | 'active' | 'suspended'
/** `invited` until the person has completed the invitation. */
export type UserStatus = 'invited' | 'active'

export interface AdminUser {
  id: string
  email: string | null
  fullName: string
  role: UserRole
  status: UserStatus
  invitedAt: string | null
  lastSignInAt: string | null
  /** Agencies managed through an active membership (agency users). */
  agencies: { id: string; name: string }[]
  /** Every eligibility row of a nurse, with its status. */
  eligibleBranches: { id: string; name: string; agency: { id: string; name: string }; status: EligibilityStatus }[]
}

/** The assignment depends on the role; the API rejects any mismatch. */
export type InviteUserInput = { email: string; fullName: string } & (
  { role: 'admin' } | { role: 'agency'; agencyIds: string[] } | { role: 'nurse'; branchId: string }
)

export async function listAdminUsers(): Promise<AdminUser[]> {
  const { users } = await apiRequest<{ users: AdminUser[] }>('/admin/users')
  return users
}

/** Invites someone by email; the API sends the link. The response never carries it. */
export async function inviteUser(input: InviteUserInput): Promise<AdminUser> {
  const { user } = await apiRequest<{ user: AdminUser }>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return user
}

// ---------------------------------------------------------------------------
// Nurse eligibility (agency users for their agencies; admins for any).
// ---------------------------------------------------------------------------

/** One nurse connected to the caller's agencies, with their status at each branch that has a record. */
export interface NurseEligibility {
  nurse: { id: string; fullName: string }
  branches: {
    branch: { id: string; name: string; agency: { id: string; name: string } }
    status: EligibilityStatus
    activatedAt: string | null
  }[]
}

export interface EligibilityRecord {
  nurseId: string
  branchId: string
  status: EligibilityStatus
  activatedAt: string | null
}

export async function listAgencyNurses(): Promise<NurseEligibility[]> {
  const { nurses } = await apiRequest<{ nurses: NurseEligibility[] }>('/agency/nurses')
  return nurses
}

const eligibilityPath = (nurseId: string, branchId: string) =>
  `/nurses/${encodeURIComponent(nurseId)}/eligibility/${encodeURIComponent(branchId)}`

/** Makes the nurse eligible at the branch (creates the record when missing). */
export async function activateEligibility(nurseId: string, branchId: string): Promise<EligibilityRecord> {
  const { eligibility } = await apiRequest<{ eligibility: EligibilityRecord }>(eligibilityPath(nurseId, branchId), {
    method: 'PUT',
  })
  return eligibility
}

/** Suspends the nurse at the branch; existing claims are untouched. */
export async function suspendEligibility(nurseId: string, branchId: string): Promise<EligibilityRecord> {
  const { eligibility } = await apiRequest<{ eligibility: EligibilityRecord }>(eligibilityPath(nurseId, branchId), {
    method: 'DELETE',
  })
  return eligibility
}

// ---------------------------------------------------------------------------
// Password links (public). The token travels only in the request body, once.
// ---------------------------------------------------------------------------

export type PasswordLinkType = 'invite' | 'recovery'

export interface CompletePasswordInput {
  tokenHash: string
  type: PasswordLinkType
  password: string
}

/** Sets the password behind an invitation or recovery link and starts a session exactly like `login`. */
export async function completePassword(input: CompletePasswordInput): Promise<SessionUser> {
  const { token, user } = await apiRequest<AuthPayload>('/auth/complete-password', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  setAccessToken(token)
  return user
}

/** Asks for a recovery email. The API answers 204 whether or not the address exists. */
export async function requestRecovery(email: string): Promise<void> {
  await apiRequest<undefined>('/auth/recover', { method: 'POST', body: JSON.stringify({ email }) })
}

/** Removes an agency that never had shifts (409 otherwise). */
export async function deleteAgency(agencyId: string): Promise<void> {
  await apiRequest<undefined>(agencyPath(agencyId), { method: 'DELETE' })
}

/** Removes an account without shifts or recorded actions (409 otherwise). */
export async function deleteAdminUser(userId: string): Promise<void> {
  await apiRequest<undefined>(`/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' })
}
