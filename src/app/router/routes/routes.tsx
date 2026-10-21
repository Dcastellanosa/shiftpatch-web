import type { ReactNode } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router'
import { AdminShiftsPage } from '../../../pages/AdminShiftsPage/index.ts'
import { AgencyShiftsPage } from '../../../pages/AgencyShiftsPage/index.ts'
import { AvailableShiftsPage } from '../../../pages/AvailableShiftsPage/index.ts'
import { ComingSoonPage } from '../../../pages/ComingSoonPage/index.ts'
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
      <Route path="/agency/shifts" element={guarded(<AgencyShiftsPage />)} />
      <Route
        path="/agency/nurses"
        element={guarded(<ComingSoonPage title="Nurses" description="Manage which nurses may work at each of your branches." />)}
      />
      <Route path="/admin/shifts" element={guarded(<AdminShiftsPage />)} />
      <Route
        path="/admin/agencies"
        element={guarded(<ComingSoonPage title="Agencies" description="Create agencies and their branches." />)}
      />
      <Route path="/admin/users" element={guarded(<ComingSoonPage title="Users" description="Invite staff and assign their agencies." />)} />
      <Route path="*" element={<NotFound role={role} />} />
    </Routes>
  )
}
