import { createContext, useContext } from 'react'
import type { ApiError, SessionUser } from '../../lib/api-client/api-client.ts'

export interface SessionContextValue {
  /** True until the initial `GET /api/auth/me` settles. */
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
