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
  agencyId: string | null
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
