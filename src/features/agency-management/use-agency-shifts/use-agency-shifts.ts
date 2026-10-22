import { useQuery } from '@tanstack/react-query'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { listAgencyShifts } from '../../../shared/api/client/index.ts'

/** The agency's own shifts (`agencyId` is the signed-in agency user's public id). */
export function useAgencyShifts(agencyId: string) {
  return useQuery({
    queryKey: shiftKeys.agency(agencyId),
    queryFn: () => listAgencyShifts(agencyId),
    enabled: agencyId !== '',
  })
}
