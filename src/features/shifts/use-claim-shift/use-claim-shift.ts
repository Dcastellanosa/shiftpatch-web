import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MY_SHIFTS_QUERY_KEY, shiftKeys } from '../../../entities/shift/queries/index.ts'
import { claimShift } from '../../../shared/api/client/index.ts'
import { toApiError } from '../../../shared/api/errors/index.ts'
import { formatLocalDate } from '../../../shared/lib/format/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'

/**
 * Claims a shift for the signed-in nurse in one click. The API performs
 * every eligibility check atomically; the outcome is announced through the
 * notification banner either way, with the API's own message on failure
 * (for example "Credential expired, cannot claim shift").
 */
export function useClaimShift() {
  const queryClient = useQueryClient()
  const pushToast = useUiStore((state) => state.pushToast)
  return useMutation({
    mutationFn: (shiftId: string) => claimShift(shiftId),
    onSuccess: (shift) => {
      pushToast({
        kind: 'success',
        title: 'Shift claimed',
        body: `${shift.role} · ${shift.agencyName} · ${formatLocalDate(shift.date)}`,
        link: { to: '/my-shifts', label: 'View My Shifts' },
      })
      void queryClient.invalidateQueries({ queryKey: shiftKeys.all })
      void queryClient.invalidateQueries({ queryKey: MY_SHIFTS_QUERY_KEY })
    },
    onError: (error) => {
      const failure = toApiError(error)
      pushToast({
        kind: 'error',
        title: 'Shift not claimed',
        body: failure.status === 0 ? 'The server could not be reached. Try again.' : failure.message,
      })
      void queryClient.invalidateQueries({ queryKey: shiftKeys.all })
    },
  })
}
