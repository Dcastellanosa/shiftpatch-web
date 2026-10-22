import { vi } from 'vitest'
import type {
  AdminUser,
  Agency,
  AgencyBranch,
  Branch,
  NurseEligibility,
  SessionUser,
  Shift,
} from '../src/shared/api/client/index.ts'

/** The trial specification's accounts, as `POST /api/auth/login` reports them. */
export const NURSE: SessionUser = { id: 'nurse-1', name: 'Maria Lopez', role: 'nurse' }
export const AGENCY: SessionUser = { id: 'agency-a', name: 'Sunrise Health Staffing', role: 'agency' }
export const ADMIN: SessionUser = { id: 'admin-1', name: 'Alex Kim', role: 'admin' }

export const TEST_TOKEN = 'test-token'

/** A sign-in response (`login` / `complete-password`). */
export const authResponse = (user: SessionUser) => json(200, { token: TEST_TOKEN, user })

/** The contract's flat shift shape (an overnight RN shift at agency-a). */
export function makeShift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: 'shift-1',
    agencyId: 'agency-a',
    agencyName: 'Sunrise Health Staffing',
    role: 'RN',
    date: '2030-01-10',
    startTime: '19:00',
    endTime: '07:00',
    status: 'open',
    claimedBy: null,
    ...overrides,
  }
}

type Handler = (init: RequestInit) => { status: number; body?: unknown }

export function json(status: number, body?: unknown) {
  return { status, body }
}

/** Stubs `fetch` with handlers keyed by "METHOD /api/path" (query string ignored unless included). */
export function stubApi(handlers: Record<string, Handler>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input)
    const method = (init.method ?? 'GET').toUpperCase()
    const handler = handlers[`${method} ${url}`] ?? handlers[`${method} ${url.split('?')[0]}`]
    if (!handler) return new Response(JSON.stringify({ error: 'Route not found' }), { status: 404 })
    const { status, body } = handler(init)
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export const AGENCY_ID = 'a1000000-0000-4000-8000-000000000001'
export const BRANCH_ID = 'b1000000-0000-4000-8000-000000000001'

export function makeAgency(overrides: Partial<Agency> = {}): Agency {
  return {
    id: AGENCY_ID,
    name: 'Northwind Care Staffing',
    status: 'active',
    branchCount: 2,
    createdAt: '2029-11-01T00:00:00.000Z',
    updatedAt: '2029-11-02T00:00:00.000Z',
    ...overrides,
  }
}

export function makeAgencyBranch(overrides: Partial<AgencyBranch> = {}): AgencyBranch {
  return {
    id: BRANCH_ID,
    agencyId: AGENCY_ID,
    name: 'Downtown Clinic',
    address: '120 Main Street',
    timezone: 'America/New_York',
    status: 'active',
    createdAt: '2029-11-01T00:00:00.000Z',
    updatedAt: '2029-11-02T00:00:00.000Z',
    ...overrides,
  }
}

export function makeAdminUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'c1000000-0000-4000-8000-000000000001',
    email: 'ava@example.test',
    fullName: 'Ava Thompson',
    role: 'nurse',
    status: 'active',
    invitedAt: '2029-10-01T00:00:00.000Z',
    lastSignInAt: '2029-12-01T08:00:00.000Z',
    agencies: [],
    eligibleBranches: [
      {
        id: BRANCH_ID,
        name: 'Downtown Clinic',
        agency: { id: AGENCY_ID, name: 'Northwind Care Staffing' },
        status: 'active',
      },
    ],
    ...overrides,
  }
}

export function makeBranch(overrides: Partial<Branch> = {}): Branch {
  return {
    id: BRANCH_ID,
    name: 'Downtown Clinic',
    address: '120 Main Street',
    timezone: 'America/New_York',
    status: 'active',
    agency: { id: AGENCY_ID, name: 'Northwind Care Staffing' },
    ...overrides,
  }
}

export const NURSE_ID = 'c1000000-0000-4000-8000-000000000001'
export const BRANCH_2_ID = 'b1000000-0000-4000-8000-000000000002'

export function makeNurseEligibility(overrides: Partial<NurseEligibility> = {}): NurseEligibility {
  return {
    nurse: { id: NURSE_ID, fullName: 'Ava Thompson' },
    branches: [
      {
        branch: { id: BRANCH_ID, name: 'Downtown Clinic', agency: { id: AGENCY_ID, name: 'Northwind Care Staffing' } },
        status: 'active',
        activatedAt: '2029-10-01T00:00:00.000Z',
      },
    ],
    ...overrides,
  }
}
