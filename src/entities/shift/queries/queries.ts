import { useQuery } from '@tanstack/react-query'
import { listShiftEvents } from '../../../shared/api/client/index.ts'

/**
 * Query keys for shift data. Everything hangs off `['shifts']` so one
 * invalidation after a claim, a cancellation or a post refreshes every list
 * and history.
 */
export const shiftKeys = {
  all: ['shifts'] as const,
  /** The marketplace (every agency). */
  list: () => ['shifts', 'list'] as const,
  /** One agency's own shifts. */
  agency: (agencyId: string) => ['shifts', 'agency', agencyId] as const,
  events: (shiftId: string) => ['shifts', shiftId, 'events'] as const,
}

export const MY_SHIFTS_QUERY_KEY = ['me', 'shifts'] as const

/** Append-only audit trail for one shift. */
export function useShiftEvents(shiftId: string) {
  return useQuery({ queryKey: shiftKeys.events(shiftId), queryFn: () => listShiftEvents(shiftId) })
}
