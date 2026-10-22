import type { ReactNode } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router'
import { AdminAgenciesPage } from '../../../pages/AdminAgenciesPage/index.ts'
import { AdminAgencyPage } from '../../../pages/AdminAgencyPage/index.ts'
import { AdminShiftsPage } from '../../../pages/AdminShiftsPage/index.ts'
import { AdminUsersPage } from '../../../pages/AdminUsersPage/index.ts'
import { AuditLogPage } from '../../../pages/AuditLogPage/index.ts'
import { CredentialsPage } from '../../../pages/CredentialsPage/index.ts'
import { TimesheetPage } from '../../../pages/TimesheetPage/index.ts'
import { AgencyNursesPage } from '../../../pages/AgencyNursesPage/index.ts'
import { AgencyShiftsPage } from '../../../pages/AgencyShiftsPage/index.ts'
import { AvailableShiftsPage } from '../../../pages/AvailableShiftsPage/index.ts'
import { MyShiftsPage } from '../../../pages/MyShiftsPage/index.ts'
import type { UserRole } from '../../../shared/api/client/index.ts'
import { EmptyState } from '../../../shared/ui/EmptyState/index.ts'
import { RequireRole } from '../RequireRole/index.ts'
import { homeFor } from '../navigation/index.ts'

function NotFound({ role }: { role: UserRole }) {
  return (
    <EmptyState title="Page not found">
      <Link to={homeFor(role)}>Go to your shifts</Link>
    </EmptyState>
  )
}

/**
 * Declarative routes for a signed-in user. Every screen sits behind the
 * UX-only role guard; the API re-checks every request.
 */
export function AppRoutes({ role }: { role: UserRole }) {
  const guarded = (screen: ReactNode) => <RequireRole role={role}>{screen}</RequireRole>
  return (
    <Routes>
      <Route path="/" element={<Navigate to={homeFor(role)} replace />} />
      <Route path="/shifts" element={guarded(<AvailableShiftsPage />)} />
      <Route path="/my-shifts" element={guarded(<MyShiftsPage />)} />
      <Route path="/credentials" element={guarded(<CredentialsPage />)} />
      <Route path="/timesheets" element={guarded(<TimesheetPage />)} />
      <Route path="/agency/shifts" element={guarded(<AgencyShiftsPage />)} />
      <Route path="/agency/nurses" element={guarded(<AgencyNursesPage />)} />
      <Route path="/admin/shifts" element={guarded(<AdminShiftsPage />)} />
      <Route path="/admin/agencies" element={guarded(<AdminAgenciesPage />)} />
      <Route path="/admin/agencies/:agencyId" element={guarded(<AdminAgencyPage />)} />
      <Route path="/admin/users" element={guarded(<AdminUsersPage />)} />
      <Route path="/admin/audit-log" element={guarded(<AuditLogPage />)} />
      <Route path="*" element={<NotFound role={role} />} />
    </Routes>
  )
}
