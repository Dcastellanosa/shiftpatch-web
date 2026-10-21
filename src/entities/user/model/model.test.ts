import { expect, it } from 'vitest'
import { ELIGIBILITY_STATUS_LABEL, USER_ROLES, USER_ROLE_LABEL, USER_STATUS_LABEL } from './index.ts'

it('labels every role, user status and eligibility status', () => {
  expect(USER_ROLES).toEqual(['nurse', 'agency', 'admin'])
  expect(Object.keys(USER_ROLE_LABEL).sort()).toEqual([...USER_ROLES].sort())
  expect(USER_STATUS_LABEL).toEqual({ invited: 'Invited', active: 'Active' })
  expect(ELIGIBILITY_STATUS_LABEL.suspended).toBe('Suspended')
})
