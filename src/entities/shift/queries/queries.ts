import { useQuery } from '@tanstack/react-query'
import { listShiftEvents, type ShiftFilters } from '../../../shared/api/client/index.ts'

/**
 * Query keys for shift data. Everything hangs off `['shifts']` so one
 * invalidation after a claim or a create refreshes every list and history.
 */
export const shiftKeys = {
  all: ['shifts'] as const,
  list: (filters: ShiftFilters = {}) => ['shifts', 'list', filters] as const,
  events: (shiftId: string) => ['shifts', shiftId, 'events'] as const,
}

export const MY_SHIFTS_QUERY_KEY = ['me', 'shifts'] as const

/** Append-only audit trail for one shift. */
export function useShiftEvents(shiftId: string) {
  return useQuery({ queryKey: shiftKeys.events(shiftId), queryFn: () => listShiftEvents(shiftId) })
}
