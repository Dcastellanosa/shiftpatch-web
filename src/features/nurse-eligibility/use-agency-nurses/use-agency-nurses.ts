import { useQuery } from '@tanstack/react-query'
import { listAgencyNurses } from '../../../shared/api/client/index.ts'

export const AGENCY_NURSES_QUERY_KEY = ['agency', 'nurses'] as const

/** Nurses connected to the caller's agencies with their status at each branch. */
export function useAgencyNurses() {
  return useQuery({ queryKey: AGENCY_NURSES_QUERY_KEY, queryFn: listAgencyNurses })
}
