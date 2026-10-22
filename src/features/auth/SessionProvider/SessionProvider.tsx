import { hashKey, useQueryClient } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import { toApiError } from '../../../shared/api/errors/index.ts'
import { onSessionLost } from '../../../shared/api/token/index.ts'
import { SessionContext } from '../session-context/index.ts'
import { useLogin } from '../use-login/index.ts'
import { useLogout } from '../use-logout/index.ts'
import { SESSION_QUERY_KEY, useSessionQuery } from '../use-session-query/index.ts'

/**
 * Exposes the session: the user the API reported at sign-in (the
 * `['session']` query). The token itself stays in the API client's memory
 * holder; nothing about the session is stored in the browser, so a reload
 * starts anonymous. When any request answers 401 the client drops the token
 * and this provider signs the app out locally.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const session = useSessionQuery()
  const loginMutation = useLogin()
  const logoutMutation = useLogout()

  // Like a sign-out, but triggered by the API: drop every other query, then
  // overwrite the session in place so its observer re-renders to anonymous.
  useEffect(
    () =>
      onSessionLost(() => {
        const sessionHash = hashKey(SESSION_QUERY_KEY)
        queryClient.removeQueries({ predicate: (query) => query.queryHash !== sessionHash })
        queryClient.setQueryData(SESSION_QUERY_KEY, null)
      }),
    [queryClient],
  )

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
        loading: logoutMutation.isPending,
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
