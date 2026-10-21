import { useEffect, useState, type ReactNode } from 'react'
import * as api from '../../lib/api-client/index.ts'
import { toApiError } from '../../lib/errors/index.ts'
import { SessionContext } from '../session-context/index.ts'

interface SessionState {
  loading: boolean
  user: api.SessionUser | null
  error: api.ApiError | null
}

/**
 * Holds the current session as reported by the API. `GET /api/auth/me` is the
 * source of truth; nothing about the session is stored in the browser.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ loading: true, user: null, error: null })

  useEffect(() => {
    let cancelled = false
    api.getCurrentSession().then(
      (user) => {
        if (!cancelled) setState({ loading: false, user, error: null })
      },
      (error: unknown) => {
        if (!cancelled) setState({ loading: false, user: null, error: toApiError(error) })
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  async function login(email: string, password: string) {
    setState((current) => ({ ...current, error: null }))
    try {
      const user = await api.login(email, password)
      setState({ loading: false, user, error: null })
    } catch (error) {
      setState({ loading: false, user: null, error: toApiError(error) })
    }
  }

  async function logout() {
    try {
      await api.logout()
      setState({ loading: false, user: null, error: null })
    } catch (error) {
      setState((current) => ({ ...current, error: toApiError(error) }))
    }
  }

  return (
    <SessionContext
      value={{
        loading: state.loading,
        authenticated: state.user !== null,
        user: state.user,
        error: state.error,
        login,
        logout,
      }}
    >
      {children}
    </SessionContext>
  )
}
