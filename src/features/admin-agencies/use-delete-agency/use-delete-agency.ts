import { useMutation, useQueryClient } from '@tanstack/react-query'
import { agencyKeys } from '../../../entities/agency/queries/index.ts'
import { BRANCHES_QUERY_KEY } from '../../../entities/branch/use-branches/index.ts'
import { ADMIN_USERS_QUERY_KEY } from '../../../entities/user/queries/index.ts'
import { deleteAgency, type Agency } from '../../../shared/api/client/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'

/** Deletes an agency after confirmation; the API refuses agencies with shift history. */
export function useDeleteAgency() {
  const queryClient = useQueryClient()
  const pushToast = useUiStore((state) => state.pushToast)
  return useMutation({
    mutationFn: (agency: Pick<Agency, 'id' | 'name'>) => deleteAgency(agency.id),
    onSuccess: (_, agency) => {
      pushToast({ kind: 'success', title: 'Agency deleted', body: agency.name })
      queryClient.removeQueries({ queryKey: agencyKeys.detail(agency.id) })
      void queryClient.invalidateQueries({ queryKey: agencyKeys.all })
      void queryClient.invalidateQueries({ queryKey: BRANCHES_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
    },
    onError: (error, agency) => {
      pushToast({ kind: 'error', title: 'Agency not deleted', body: `${agency.name}: ${error.message}` })
    },
  })
}
