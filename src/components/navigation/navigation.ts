import type { UserRole } from '../../lib/api-client/index.ts'

export interface NavItem {
  to: string
  label: string
}

/** Screens available to each role. The API enforces access; this only shapes the UI. */
export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  nurse: [
    { to: '/shifts', label: 'Available Shifts' },
    { to: '/my-shifts', label: 'My Shifts' },
  ],
  agency: [{ to: '/agency/shifts', label: 'Agency Shifts' }],
  admin: [{ to: '/admin/shifts', label: 'All Shifts' }],
}

export const homeFor = (role: UserRole) => NAV_BY_ROLE[role][0]!.to

export function isAllowed(role: UserRole, pathname: string) {
  return NAV_BY_ROLE[role].some((item) => item.to === pathname)
}

export function isKnownPath(pathname: string) {
  return Object.values(NAV_BY_ROLE).some((items) => items.some((item) => item.to === pathname))
}

export const ROLE_LABEL: Record<UserRole, string> = { nurse: 'Nurse', agency: 'Agency', admin: 'Admin' }
