import { useQuery } from '@tanstack/react-query'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { listShifts, type ShiftStatus } from '../../../shared/api/client/index.ts'

/** The agency's own shifts, optionally narrowed to one status. */
export function useAgencyShifts(status?: ShiftStatus) {
  return useQuery({ queryKey: shiftKeys.list({ status }), queryFn: () => listShifts({ status }) })
}
