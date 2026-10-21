import { expect, it } from 'vitest'
import { NAV_BY_ROLE, homeFor, isAllowed, isKnownPath } from './index.ts'

it('routes each role only to its screens', () => {
  expect(homeFor('nurse')).toBe('/shifts')
  expect(homeFor('agency')).toBe('/agency/shifts')
  expect(homeFor('admin')).toBe('/admin/shifts')
  expect(isAllowed('nurse', '/admin/shifts')).toBe(false)
  expect(isAllowed('admin', '/admin/shifts')).toBe(true)
  expect(isAllowed('agency', '/agency/nurses')).toBe(true)
  expect(isKnownPath('/missing')).toBe(false)
})

it('lists the placeholder screens for agency and admin users', () => {
  expect(NAV_BY_ROLE.agency.map((item) => item.to)).toEqual(['/agency/shifts', '/agency/nurses'])
  expect(NAV_BY_ROLE.admin.map((item) => item.to)).toEqual(['/admin/shifts', '/admin/agencies', '/admin/users'])
})
