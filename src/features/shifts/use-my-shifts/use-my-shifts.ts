import { useQuery } from '@tanstack/react-query'
import { MY_SHIFTS_QUERY_KEY } from '../../../entities/shift/queries/index.ts'
import { listMyShifts } from '../../../shared/api/client/index.ts'

/** The signed-in nurse's assigned shifts, split into upcoming and past. */
export function useMyShifts() {
  return useQuery({ queryKey: MY_SHIFTS_QUERY_KEY, queryFn: listMyShifts })
}
