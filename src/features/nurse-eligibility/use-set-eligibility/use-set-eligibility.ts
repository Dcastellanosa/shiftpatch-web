import { useMutation, useQueryClient } from '@tanstack/react-query'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { ADMIN_USERS_QUERY_KEY } from '../../../entities/user/queries/index.ts'
import { activateEligibility, suspendEligibility } from '../../../shared/api/client/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { AGENCY_NURSES_QUERY_KEY } from '../use-agency-nurses/index.ts'

export interface SetEligibilityInput {
  nurseId: string
  nurseName: string
  branchId: string
  branchName: string
  status: 'active' | 'suspended'
}

/**
 * Activates (PUT) or suspends (DELETE) a nurse at one branch. Who may see
 * which open shifts changes with it, so nurse and shift data refresh.
 */
export function useSetEligibility() {
  const queryClient = useQueryClient()
  const pushToast = useUiStore((state) => state.pushToast)
  return useMutation({
    mutationFn: ({ nurseId, branchId, status }: SetEligibilityInput) =>
      status === 'active' ? activateEligibility(nurseId, branchId) : suspendEligibility(nurseId, branchId),
    onSuccess: (record, { nurseName, branchName }) => {
      pushToast({
        kind: 'success',
        title: record.status === 'active' ? 'Nurse activated' : 'Nurse suspended',
        body: `${nurseName} · ${branchName}`,
      })
      void queryClient.invalidateQueries({ queryKey: AGENCY_NURSES_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: shiftKeys.all })
    },
    onError: (error, { nurseName, branchName, status }) => {
      pushToast({
        kind: 'error',
        title: status === 'active' ? 'Nurse not activated' : 'Nurse not suspended',
        body: `${nurseName} · ${branchName}: ${error.message}`,
      })
    },
  })
}
