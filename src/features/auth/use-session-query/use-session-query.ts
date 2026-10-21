import { queryOptions, useQuery } from '@tanstack/react-query'
import { getCurrentSession } from '../../../shared/api/client/index.ts'

export const SESSION_QUERY_KEY = ['session'] as const

/**
 * The one source of session truth: `GET /api/auth/me`, asked once per page
 * load. It never goes stale on its own and is replaced only by login/logout.
 */
export const sessionQueryOptions = queryOptions({
  queryKey: SESSION_QUERY_KEY,
  queryFn: getCurrentSession,
  staleTime: Infinity,
  refetchOnWindowFocus: false,
})

export function useSessionQuery() {
  return useQuery(sessionQueryOptions)
}
