import { vi } from 'vitest'
import type { SessionUser, Shift } from '../src/shared/api/client/index.ts'

export const NURSE: SessionUser = { id: 'u-nurse', email: 'nurse@example.test', fullName: 'Ava Thompson', role: 'nurse', agencyId: null }
export const AGENCY: SessionUser = { id: 'u-agency', email: 'agency@example.test', fullName: 'Riley Northwind', role: 'agency', agencyId: 'agency-1' }
export const ADMIN: SessionUser = { id: 'u-admin', email: 'admin@example.test', fullName: 'Morgan Admin', role: 'admin', agencyId: null }

export function makeShift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: '5f0c1d3e-0000-4000-8000-000000000001',
    title: 'Med-Surg RN — Day',
    startsAt: '2030-01-10T13:00:00.000Z',
    endsAt: '2030-01-10T21:00:00.000Z',
    status: 'open',
    branch: { id: 'branch-1', name: 'Downtown Clinic', address: '120 Main Street', timezone: 'America/New_York' },
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
