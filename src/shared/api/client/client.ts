/**
 * The frontend's only gateway to backend data. Every request goes to the
 * same-origin `/api` prefix, which the Vite dev server (locally) or Vercel
 * (deployed) proxies to shiftpatch-api. Session state lives in HttpOnly
 * cookies managed by the API; this module never sees or stores tokens.
 */

export const API_BASE = '/api'

export type UserRole = 'agency' | 'nurse' | 'admin'

/** Safe session payload returned by the API. Profile fields may be null. */
export interface SessionUser {
  id: string
  email: string | null
  fullName: string | null
  role: UserRole | null
  /** First active agency (agency users). Prefer `agencyIds`. */
  agencyId: string | null
  /** Every agency the user manages through an active membership. */
  agencyIds: string[]
}

interface SessionPayload {
  user: SessionUser
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

interface ErrorBody {
  error: { code: string; message: string; details?: unknown }
}

function isErrorBody(value: unknown): value is ErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false
  const error = (value as { error: unknown }).error
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { code?: unknown }).code === 'string' &&
    typeof (error as { message?: unknown }).message === 'string'
  )
}

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
  if (init.body !== undefined) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' })
  } catch {
    throw new ApiError(0, 'network_error', 'Unable to reach the server')
  }

  const body = await readJson(response)
  if (!response.ok) {
    if (isErrorBody(body)) {
      throw new ApiError(response.status, body.error.code, body.error.message, body.error.details)
    }
    throw new ApiError(response.status, 'http_error', `Request failed with status ${response.status}`)
  }
  return body as T
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const { user } = await apiRequest<SessionPayload>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return user
}

export async function logout(): Promise<void> {
  await apiRequest<void>('/auth/logout', { method: 'POST' })
}

/**
 * Authoritative session check. Resolves to `null` when the API reports no
 * valid session (401); any other failure is thrown.
 */
export async function getCurrentSession(): Promise<SessionUser | null> {
  try {
    const { user } = await apiRequest<SessionPayload>('/auth/me')
    return user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

// ---------------------------------------------------------------------------
// Shifts. Shapes mirror shiftpatch-api's Zod response contracts
// (src/shifts/contracts.ts there). Timestamps are ISO 8601 UTC strings.
// ---------------------------------------------------------------------------

export type ShiftStatus = 'open' | 'claimed' | 'cancelled' | 'completed' | 'no_show'
export type ShiftEventType = 'created' | 'claimed' | 'cancelled' | 'completed' | 'no_show'

export interface Shift {
  id: string
  title: string
  startsAt: string
  endsAt: string
  status: ShiftStatus
  branch: { id: string; name: string; address: string; timezone: string; status: EntityStatus }
  agency: { id: string; name: string }
  assignedNurse: { id: string; fullName: string } | null
  createdAt: string
  updatedAt: string
}

export interface ShiftEvent {
  id: string
  eventType: ShiftEventType
  previousStatus: ShiftStatus | null
  newStatus: ShiftStatus
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

export interface ShiftFilters {
  status?: ShiftStatus
  branchId?: string
  /** ISO instant: shifts starting at or after. */
  from?: string
  /** ISO instant: shifts starting before. */
  to?: string
  /** Nurse only: include the caller's assigned shifts. */
  includeAssigned?: boolean
}

export interface CreateShiftInput {
  branchId: string
  title: string
  startsAt: string
  endsAt: string
}

function queryString(filters: ShiftFilters): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

const shiftPath = (shiftId: string) => `/shifts/${encodeURIComponent(shiftId)}`

export async function listShifts(filters: ShiftFilters = {}): Promise<Shift[]> {
  const { shifts } = await apiRequest<{ shifts: Shift[] }>(`/shifts${queryString(filters)}`)
  return shifts
}

export async function getShift(shiftId: string): Promise<Shift> {
  const { shift } = await apiRequest<{ shift: Shift }>(shiftPath(shiftId))
  return shift
}

export async function createShift(input: CreateShiftInput): Promise<Shift> {
  const { shift } = await apiRequest<{ shift: Shift }>('/shifts', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return shift
}

/** Claims a shift for the signed-in nurse. Rule failures reject with an `ApiError` (409/422). */
export async function claimShift(shiftId: string): Promise<Shift> {
  const { shift } = await apiRequest<{ shift: Shift }>(`${shiftPath(shiftId)}/claim`, { method: 'POST' })
  return shift
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
  const { agency } = await apiRequest<{ agency: Agency }>('/admin/agencies', { method: 'POST', body: JSON.stringify(input) })
  return agency
}

export async function updateAgency(agencyId: string, input: UpdateAgencyInput): Promise<Agency> {
  const { agency } = await apiRequest<{ agency: Agency }>(agencyPath(agencyId), { method: 'PATCH', body: JSON.stringify(input) })
  return agency
}

export async function createBranch(agencyId: string, input: CreateBranchInput): Promise<AgencyBranch> {
  const { branch } = await apiRequest<{ branch: AgencyBranch }>(`${agencyPath(agencyId)}/branches`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return branch
}

export async function updateBranch(agencyId: string, branchId: string, input: UpdateBranchInput): Promise<AgencyBranch> {
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
  | { role: 'admin' }
  | { role: 'agency'; agencyIds: string[] }
  | { role: 'nurse'; branchId: string }
)

export async function listAdminUsers(): Promise<AdminUser[]> {
  const { users } = await apiRequest<{ users: AdminUser[] }>('/admin/users')
  return users
}

/** Invites someone by email; the API sends the link. The response never carries it. */
export async function inviteUser(input: InviteUserInput): Promise<AdminUser> {
  const { user } = await apiRequest<{ user: AdminUser }>('/admin/users', { method: 'POST', body: JSON.stringify(input) })
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
  const { eligibility } = await apiRequest<{ eligibility: EligibilityRecord }>(eligibilityPath(nurseId, branchId), { method: 'PUT' })
  return eligibility
}

/** Suspends the nurse at the branch; existing claims are untouched. */
export async function suspendEligibility(nurseId: string, branchId: string): Promise<EligibilityRecord> {
  const { eligibility } = await apiRequest<{ eligibility: EligibilityRecord }>(eligibilityPath(nurseId, branchId), { method: 'DELETE' })
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

/** Sets the password behind an invitation or recovery link and starts a session (cookies set by the API). */
export async function completePassword(input: CompletePasswordInput): Promise<SessionUser> {
  const { user } = await apiRequest<SessionPayload>('/auth/complete-password', { method: 'POST', body: JSON.stringify(input) })
  return user
}

/** Asks for a recovery email. The API answers 204 whether or not the address exists. */
export async function requestRecovery(email: string): Promise<void> {
  await apiRequest<undefined>('/auth/recover', { method: 'POST', body: JSON.stringify({ email }) })
}

/** Removes an agency that never had shifts (409 `agency_has_shifts` otherwise). */
export async function deleteAgency(agencyId: string): Promise<void> {
  await apiRequest<undefined>(agencyPath(agencyId), { method: 'DELETE' })
}

/** Removes an account without shifts or recorded actions (409 `user_has_history` / `cannot_delete_self` otherwise). */
export async function deleteAdminUser(userId: string): Promise<void> {
  await apiRequest<undefined>(`/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' })
}
