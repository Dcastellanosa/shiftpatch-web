import { expect, it } from 'vitest'
import { ENTITY_STATUS_LABEL, supportedTimezones } from './index.ts'

it('labels both statuses and lists usable time zones', () => {
  expect(ENTITY_STATUS_LABEL).toEqual({ active: 'Active', inactive: 'Inactive' })
  const zones = supportedTimezones()
  expect(zones).toContain('UTC')
  expect(zones).toContain('America/New_York')
})
