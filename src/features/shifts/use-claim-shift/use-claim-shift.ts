import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MY_SHIFTS_QUERY_KEY, shiftKeys } from '../../../entities/shift/queries/index.ts'
import { claimShift } from '../../../shared/api/client/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'

/**
 * Claims a shift for the signed-in nurse. The API performs every eligibility
 * check atomically; on success the shift lists and My Shifts are refreshed
 * and a confirmation toast is queued.
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
        body: `${shift.title} at ${shift.branch.name} is now yours.`,
        link: { to: '/my-shifts', label: 'View My Shifts' },
      })
      void queryClient.invalidateQueries({ queryKey: shiftKeys.all })
      void queryClient.invalidateQueries({ queryKey: MY_SHIFTS_QUERY_KEY })
    },
  })
}
