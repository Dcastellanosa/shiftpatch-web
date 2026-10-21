import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BRANCHES_QUERY_KEY } from '../../../entities/branch/use-branches/index.ts'
import { agencyKeys } from '../../../entities/agency/queries/index.ts'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { updateAgency, type UpdateAgencyInput } from '../../../shared/api/client/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'

/**
 * Renames, activates or deactivates an agency. A status change affects which
 * branches can take shifts, so branch and shift data refresh too.
 */
export function useUpdateAgency(agencyId: string) {
  const queryClient = useQueryClient()
  const pushToast = useUiStore((state) => state.pushToast)
  return useMutation({
    mutationFn: (input: UpdateAgencyInput) => updateAgency(agencyId, input),
    onSuccess: (agency, input) => {
      const title = input.status ? (input.status === 'active' ? 'Agency activated' : 'Agency deactivated') : 'Agency updated'
      pushToast({ kind: 'success', title, body: agency.name })
      void queryClient.invalidateQueries({ queryKey: agencyKeys.all })
      if (input.status) {
        void queryClient.invalidateQueries({ queryKey: BRANCHES_QUERY_KEY })
        void queryClient.invalidateQueries({ queryKey: shiftKeys.all })
      }
    },
  })
}
