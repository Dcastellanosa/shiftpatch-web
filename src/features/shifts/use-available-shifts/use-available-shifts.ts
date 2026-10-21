import { useQuery } from '@tanstack/react-query'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { listShifts } from '../../../shared/api/client/index.ts'

/** Open shifts at branches where the signed-in nurse is active. */
export function useAvailableShifts() {
  return useQuery({ queryKey: shiftKeys.list(), queryFn: () => listShifts() })
}
