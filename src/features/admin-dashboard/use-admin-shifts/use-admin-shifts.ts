import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { listShifts, type ShiftFilters } from '../../../shared/api/client/index.ts'

export type AdminShiftFilters = Pick<ShiftFilters, 'branchId' | 'from' | 'to'>

/**
 * Every shift the admin may see, filtered on the API by branch and date
 * range. The previous rows stay on screen while a new filter loads.
 */
export function useAdminShifts(filters: AdminShiftFilters) {
  return useQuery({
    queryKey: shiftKeys.list(filters),
    queryFn: () => listShifts(filters),
    placeholderData: keepPreviousData,
  })
}
