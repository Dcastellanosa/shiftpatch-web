import { useQuery } from '@tanstack/react-query'
import { listBranches } from '../../../shared/api/client/index.ts'

export const BRANCHES_QUERY_KEY = ['branches'] as const

/** Branches visible to the caller (the agency's own, or all for an admin). */
export function useBranches() {
  return useQuery({ queryKey: BRANCHES_QUERY_KEY, queryFn: listBranches })
}
