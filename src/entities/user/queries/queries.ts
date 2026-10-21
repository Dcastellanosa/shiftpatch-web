import { useQuery } from '@tanstack/react-query'
import { listAdminUsers } from '../../../shared/api/client/index.ts'

export const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const

/** Every account with its access (admin only). */
export function useAdminUsers() {
  return useQuery({ queryKey: ADMIN_USERS_QUERY_KEY, queryFn: listAdminUsers })
}
