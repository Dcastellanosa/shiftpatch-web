import { useEffect } from 'react'
import { useSession } from '../auth/session-context/index.ts'
import { AppShell } from '../components/AppShell/index.ts'
import { Link } from '../components/Link/index.ts'
import { homeFor, isAllowed, isKnownPath } from '../components/navigation/index.ts'
import { EmptyState } from '../components/EmptyState/index.ts'
import { LoadingState } from '../components/LoadingState/index.ts'
import type { UserRole } from '../lib/api-client/index.ts'
import { navigate, useLocation } from '../lib/router/index.ts'
import { AdminShiftsPage } from '../pages/AdminShiftsPage/index.ts'
import { AgencyShiftsPage } from '../pages/AgencyShiftsPage/index.ts'
import { AvailableShiftsPage } from '../pages/AvailableShiftsPage/index.ts'
import { MyShiftsPage } from '../pages/MyShiftsPage/index.ts'
import { SignInPage } from '../pages/SignInPage/index.ts'
import './App.scss'

const PAGES: Record<string, () => React.JSX.Element> = {
  '/shifts': AvailableShiftsPage,
  '/my-shifts': MyShiftsPage,
  '/agency/shifts': AgencyShiftsPage,
  '/admin/shifts': AdminShiftsPage,
}

function Redirect({ to }: { to: string }) {
  useEffect(() => navigate(to, { replace: true }), [to])
  return <LoadingState />
}

function RoutedPage({ role }: { role: UserRole }) {
  const { pathname } = useLocation()
  if (pathname === '/') return <Redirect to={homeFor(role)} />
  if (!isKnownPath(pathname)) {
    return (
      <EmptyState title="Page not found">
        <Link to={homeFor(role)}>Go to your shifts</Link>
      </EmptyState>
    )
  }
  if (!isAllowed(role, pathname)) {
    return (
      <div className="state state-error" role="alert">
        <p className="state-title">You do not have access to this page</p>
        <p>
          This screen is for a different role. <Link to={homeFor(role)}>Go to your shifts</Link>
        </p>
      </div>
    )
  }
  const Page = PAGES[pathname]!
  return <Page />
}

/** Session gate and role-aware routing. Every authorization decision is re-checked by the API. */
function App() {
  const session = useSession()

  if (session.loading) {
    return (
      <main className="auth-page">
        <LoadingState label="Checking your session…" />
      </main>
    )
  }
  // The sign-in page also shows session errors (e.g. the API is unreachable).
  if (!session.authenticated || !session.user) return <SignInPage />

  const role = session.user.role
  return (
    <AppShell role={role}>
      {role ? (
        <RoutedPage role={role} />
      ) : (
        <EmptyState title="Your account is not set up yet">
          Ask a ShiftPatch administrator to assign your role, then sign in again.
        </EmptyState>
      )}
    </AppShell>
  )
}

export default App
