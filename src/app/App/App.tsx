import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useSession } from '../../features/auth/session-context/index.ts'
import { SignInPage } from '../../pages/SignInPage/index.ts'
import { AppShell } from '../../shared/ui/AppShell/index.ts'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'
import { LoadingState } from '../../shared/ui/LoadingState/index.ts'
import { AppRoutes } from '../router/routes/index.ts'
import './App.scss'

/** Session gate and role-aware routing. Every authorization decision is re-checked by the API. */
function App() {
  const session = useSession()
  const navigate = useNavigate()
  const wasAuthenticated = useRef(false)

  // When a session ends (sign-out or expiry) return to the root, so the next
  // sign-in starts at that role's home rather than on the previous screen.
  // Runs only once the screens are unmounted, so no route redirect interferes.
  useEffect(() => {
    if (session.loading) return
    if (session.authenticated) {
      wasAuthenticated.current = true
    } else if (wasAuthenticated.current) {
      wasAuthenticated.current = false
      void navigate('/', { replace: true })
    }
  }, [session.authenticated, session.loading, navigate])

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
        <AppRoutes role={role} />
      ) : (
        <EmptyState title="Your account is not set up yet">
          Ask a ShiftPatch administrator to assign your role, then sign in again.
        </EmptyState>
      )}
    </AppShell>
  )
}

export default App
