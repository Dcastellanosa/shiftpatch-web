import { vi } from 'vitest'
import type { AdminUser, Agency, AgencyBranch, Branch, NurseEligibility, SessionUser, Shift } from '../src/shared/api/client/index.ts'

export const NURSE: SessionUser = { id: 'u-nurse', email: 'nurse@example.test', fullName: 'Ava Thompson', role: 'nurse', agencyId: null, agencyIds: [] }
export const AGENCY: SessionUser = { id: 'u-agency', email: 'agency@example.test', fullName: 'Riley Northwind', role: 'agency', agencyId: 'agency-1', agencyIds: ['agency-1'] }
export const ADMIN: SessionUser = { id: 'u-admin', email: 'admin@example.test', fullName: 'Morgan Admin', role: 'admin', agencyId: null, agencyIds: [] }

export function makeShift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: '5f0c1d3e-0000-4000-8000-000000000001',
    title: 'Med-Surg RN — Day',
    startsAt: '2030-01-10T13:00:00.000Z',
    endsAt: '2030-01-10T21:00:00.000Z',
    status: 'open',
    branch: { id: 'branch-1', name: 'Downtown Clinic', address: '120 Main Street', timezone: 'America/New_York', status: 'active' },
    agency: { id: 'agency-1', name: 'Northwind Care Staffing' },
    assignedNurse: null,
    createdAt: '2029-12-01T00:00:00.000Z',
    updatedAt: '2029-12-01T00:00:00.000Z',
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
    if (!handler) return new Response(JSON.stringify({ error: { code: 'not_found', message: 'Route not found' } }), { status: 404 })
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
    eligibleBranches: [{ id: BRANCH_ID, name: 'Downtown Clinic', agency: { id: AGENCY_ID, name: 'Northwind Care Staffing' }, status: 'active' }],
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
      { branch: { id: BRANCH_ID, name: 'Downtown Clinic', agency: { id: AGENCY_ID, name: 'Northwind Care Staffing' } }, status: 'active', activatedAt: '2029-10-01T00:00:00.000Z' },
    ],
    ...overrides,
  }
}
