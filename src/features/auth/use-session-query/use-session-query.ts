import { queryOptions, useQuery } from '@tanstack/react-query'
import type { SessionUser } from '../../../shared/api/client/index.ts'

export const SESSION_QUERY_KEY = ['session'] as const

/**
 * The signed-in user, as the API reported it at sign-in. There is nothing to
 * fetch: the token lives only in memory, so every page load starts anonymous
 * and the query is replaced by login / complete-password, cleared by logout,
 * and reset when a request answers 401.
 */
export const sessionQueryOptions = queryOptions<SessionUser | null>({
  queryKey: SESSION_QUERY_KEY,
  queryFn: async () => null,
  initialData: null,
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
})

export function useSessionQuery() {
  return useQuery(sessionQueryOptions)
}
