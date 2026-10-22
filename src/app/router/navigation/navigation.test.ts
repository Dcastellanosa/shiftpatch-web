import { expect, it } from 'vitest'
import { NAV_BY_ROLE, homeFor, isAllowed, isKnownPath } from './index.ts'

it('routes each role only to its screens', () => {
  expect(homeFor('nurse')).toBe('/shifts')
  expect(homeFor('agency')).toBe('/agency/shifts')
  expect(homeFor('admin')).toBe('/admin/shifts')
  expect(isAllowed('nurse', '/admin/shifts')).toBe(false)
  expect(isAllowed('admin', '/admin/shifts')).toBe(true)
  expect(isAllowed('agency', '/agency/nurses')).toBe(true)
  expect(isAllowed('admin', '/admin/agencies/a1000000-0000-4000-8000-000000000001')).toBe(true)
  expect(isAllowed('agency', '/admin/agencies/a1000000-0000-4000-8000-000000000001')).toBe(false)
  expect(isKnownPath('/admin/agencies/anything')).toBe(true)
  expect(isKnownPath('/missing')).toBe(false)
})

it('lists every screen of each role, including credentials, timesheets and the audit log', () => {
  expect(NAV_BY_ROLE.nurse.map((item) => item.to)).toEqual(['/shifts', '/my-shifts', '/credentials', '/timesheets'])
  expect(NAV_BY_ROLE.agency.map((item) => item.to)).toEqual(['/agency/shifts', '/agency/nurses', '/timesheets'])
  expect(NAV_BY_ROLE.admin.map((item) => item.to)).toEqual([
    '/admin/shifts',
    '/admin/agencies',
    '/admin/users',
    '/admin/audit-log',
    '/timesheets',
  ])
  expect(isAllowed('nurse', '/credentials')).toBe(true)
  expect(isAllowed('agency', '/credentials')).toBe(false)
  expect(isAllowed('admin', '/credentials')).toBe(false)
  expect(isAllowed('nurse', '/admin/audit-log')).toBe(false)
  expect(isAllowed('admin', '/admin/audit-log')).toBe(true)
  for (const role of ['nurse', 'agency', 'admin'] as const) expect(isAllowed(role, '/timesheets')).toBe(true)
})
