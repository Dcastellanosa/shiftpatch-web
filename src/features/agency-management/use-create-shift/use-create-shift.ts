import { useMutation, useQueryClient } from '@tanstack/react-query'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { createShift, type CreateShiftInput } from '../../../shared/api/client/index.ts'
import { formatLocalDate } from '../../../shared/lib/format/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'

/** Posts an open shift for the agency, then refreshes every shift list. */
export function useCreateShift() {
  const queryClient = useQueryClient()
  const pushToast = useUiStore((state) => state.pushToast)
  return useMutation({
    mutationFn: (input: CreateShiftInput) => createShift(input),
    onSuccess: (shift) => {
      pushToast({
        kind: 'success',
        title: 'Shift posted',
        body: `${shift.role} on ${formatLocalDate(shift.date)}, ${shift.startTime} – ${shift.endTime}, is open for nurses.`,
      })
      void queryClient.invalidateQueries({ queryKey: shiftKeys.all })
    },
  })
}
