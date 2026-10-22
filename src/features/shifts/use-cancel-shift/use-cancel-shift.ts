import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MY_SHIFTS_QUERY_KEY, shiftKeys } from '../../../entities/shift/queries/index.ts'
import { timesheetKeys } from '../../../entities/timesheet/queries/index.ts'
import { cancelShift, type CancellationReason } from '../../../shared/api/client/index.ts'
import { toApiError } from '../../../shared/api/errors/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'

export interface CancelShiftVariables {
  shiftId: string
  reason: CancellationReason
}

/**
 * Releases a filled shift (an agency's no-show or advance cancellation, a
 * nurse's advance cancellation). The shift reopens; the outcome is announced
 * through the notification banner, with the API's message on refusal.
 */
export function useCancelShift() {
  const queryClient = useQueryClient()
  const pushToast = useUiStore((state) => state.pushToast)
  return useMutation({
    mutationFn: ({ shiftId, reason }: CancelShiftVariables) => cancelShift(shiftId, reason),
    onSuccess: (_shift, { reason }) => {
      pushToast({
        kind: 'success',
        title: 'Shift reopened',
        body:
          reason === 'no-show'
            ? 'Marked as a no-show. The shift is open again.'
            : 'Cancelled in advance. The shift is open again.',
      })
      void queryClient.invalidateQueries({ queryKey: shiftKeys.all })
      void queryClient.invalidateQueries({ queryKey: MY_SHIFTS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: timesheetKeys.all })
    },
    onError: (error) => {
      const failure = toApiError(error)
      pushToast({
        kind: 'error',
        title: 'Shift not cancelled',
        body: failure.status === 0 ? 'The server could not be reached. Try again.' : failure.message,
      })
    },
  })
}
