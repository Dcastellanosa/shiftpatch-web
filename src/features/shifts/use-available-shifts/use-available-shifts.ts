import { useQuery } from '@tanstack/react-query'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { listShifts } from '../../../shared/api/client/index.ts'

/** The marketplace, narrowed to open shifts; whether the nurse may claim one is decided by the API on the claim. */
export function useAvailableShifts() {
  return useQuery({
    queryKey: shiftKeys.list(),
    queryFn: listShifts,
    select: (shifts) => shifts.filter((shift) => shift.status === 'open'),
  })
}
