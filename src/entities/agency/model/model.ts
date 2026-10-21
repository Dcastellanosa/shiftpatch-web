import type { EntityStatus } from '../../../shared/api/client/index.ts'

export type { Agency, AgencyBranch, AgencyDetail, EntityStatus } from '../../../shared/api/client/index.ts'

export const ENTITY_STATUS_LABEL: Record<EntityStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
}

/** IANA zone names this browser knows, for the branch form. */
export function supportedTimezones(): string[] {
  const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []
  return zones.includes('UTC') ? zones : ['UTC', ...zones]
}
