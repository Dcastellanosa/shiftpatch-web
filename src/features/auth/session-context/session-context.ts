import { createContext, useContext } from 'react'
import type { ApiError, SessionUser } from '../../../shared/api/client/index.ts'

export interface SessionContextValue {
  /** True while a sign-out is in flight (there is no initial session check: a page load starts anonymous). */
  loading: boolean
  authenticated: boolean
  user: SessionUser | null
  error: ApiError | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used within <SessionProvider>')
  return value
}
