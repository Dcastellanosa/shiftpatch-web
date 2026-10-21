import type { ReactNode } from 'react'
import { toApiError } from '../../../shared/api/errors/index.ts'
import { SessionContext } from '../session-context/index.ts'
import { useLogin } from '../use-login/index.ts'
import { useLogout } from '../use-logout/index.ts'
import { useSessionQuery } from '../use-session-query/index.ts'

/**
 * Exposes the session as reported by the API. `GET /api/auth/me` (the
 * `['session']` query) is the source of truth; nothing about the session is
 * stored in the browser.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const session = useSessionQuery()
  const loginMutation = useLogin()
  const logoutMutation = useLogout()

  const user = session.data ?? null
  const error = loginMutation.error ?? logoutMutation.error ?? session.error

  async function login(email: string, password: string) {
    try {
      await loginMutation.mutateAsync({ email, password })
    } catch {
      // Surfaced through `error`; the cache is untouched.
    }
  }

  async function logout() {
    try {
      await logoutMutation.mutateAsync()
    } catch {
      // Surfaced through `error`; the cache is cleared either way.
    }
  }

  return (
    <SessionContext
      value={{
        // Signing out counts as loading so no screen (or its `/` redirect) stays mounted meanwhile.
        loading: session.isPending || logoutMutation.isPending,
        authenticated: user !== null,
        user,
        error: error ? toApiError(error) : null,
        login,
        logout,
      }}
    >
      {children}
    </SessionContext>
  )
}
