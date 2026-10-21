import { useQuery } from '@tanstack/react-query'
import { getAgency, listAgencies } from '../../../shared/api/client/index.ts'

/** Query keys for agency administration. Everything hangs off `['agencies']`. */
export const agencyKeys = {
  all: ['agencies'] as const,
  list: () => ['agencies', 'list'] as const,
  detail: (agencyId: string) => ['agencies', agencyId] as const,
}

/** Every agency, inactive ones included (admin only). */
export function useAgencies() {
  return useQuery({ queryKey: agencyKeys.list(), queryFn: listAgencies })
}

/** One agency with its branches (admin only). */
export function useAgency(agencyId: string) {
  return useQuery({ queryKey: agencyKeys.detail(agencyId), queryFn: () => getAgency(agencyId) })
}
