import type { UserRole } from '../../../shared/api/client/index.ts'

export interface NavItem {
  to: string
  label: string
}

/**
 * Screens available to each role. The API enforces access; this only shapes
 * the UI.
 */
export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  nurse: [
    { to: '/shifts', label: 'Available Shifts' },
    { to: '/my-shifts', label: 'My Shifts' },
    { to: '/credentials', label: 'Credentials' },
    { to: '/timesheets', label: 'Timesheets' },
  ],
  agency: [
    { to: '/agency/shifts', label: 'Agency Shifts' },
    { to: '/agency/nurses', label: 'Nurses' },
    { to: '/timesheets', label: 'Timesheets' },
  ],
  admin: [
    { to: '/admin/shifts', label: 'All Shifts' },
    { to: '/admin/agencies', label: 'Agencies' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/audit-log', label: 'Audit Log' },
    { to: '/timesheets', label: 'Timesheets' },
  ],
}

export const homeFor = (role: UserRole) => NAV_BY_ROLE[role][0]!.to

/** Screens with their own sub-routes: the prefix grants the whole subtree. */
const NESTED: Record<string, string> = { '/admin/agencies/': '/admin/agencies' }

function topLevel(pathname: string) {
  const nested = Object.keys(NESTED).find((prefix) => pathname.startsWith(prefix))
  return nested ? NESTED[nested]! : pathname
}

export function isAllowed(role: UserRole, pathname: string) {
  const path = topLevel(pathname)
  return NAV_BY_ROLE[role].some((item) => item.to === path)
}

export function isKnownPath(pathname: string) {
  const path = topLevel(pathname)
  return Object.values(NAV_BY_ROLE).some((items) => items.some((item) => item.to === path))
}

export const ROLE_LABEL: Record<UserRole, string> = { nurse: 'Nurse', agency: 'Agency', admin: 'Admin' }
