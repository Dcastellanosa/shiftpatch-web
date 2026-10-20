import { expect, it } from 'vitest'
import { homeFor, isAllowed, isKnownPath } from './navigation.ts'

it('routes each role only to its screens', () => {
  expect(homeFor('nurse')).toBe('/shifts')
  expect(homeFor('agency')).toBe('/agency/shifts')
  expect(homeFor('admin')).toBe('/admin/shifts')
  expect(isAllowed('nurse', '/admin/shifts')).toBe(false)
  expect(isAllowed('admin', '/admin/shifts')).toBe(true)
  expect(isKnownPath('/missing')).toBe(false)
})
