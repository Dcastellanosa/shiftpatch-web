import type { EligibilityStatus, UserRole, UserStatus } from '../../../shared/api/client/index.ts'

export type { AdminUser, EligibilityStatus, InviteUserInput, UserStatus } from '../../../shared/api/client/index.ts'

export const USER_ROLES: readonly UserRole[] = ['nurse', 'agency', 'admin']

export const USER_ROLE_LABEL: Record<UserRole, string> = { nurse: 'Nurse', agency: 'Agency', admin: 'Admin' }

export const USER_STATUS_LABEL: Record<UserStatus, string> = { invited: 'Invited', active: 'Active' }

export const ELIGIBILITY_STATUS_LABEL: Record<EligibilityStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  suspended: 'Suspended',
}
