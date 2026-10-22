import { useQuery } from '@tanstack/react-query'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { listShifts } from '../../../shared/api/client/index.ts'

/** Every shift of every agency; the dashboard filters the loaded list. */
export function useAdminShifts() {
  return useQuery({ queryKey: shiftKeys.list(), queryFn: listShifts })
}
