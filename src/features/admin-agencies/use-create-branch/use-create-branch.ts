import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BRANCHES_QUERY_KEY } from '../../../entities/branch/use-branches/index.ts'
import { agencyKeys } from '../../../entities/agency/queries/index.ts'
import { createBranch, type CreateBranchInput } from '../../../shared/api/client/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'

/** Creates an active branch under an agency and refreshes agency and branch data. */
export function useCreateBranch(agencyId: string) {
  const queryClient = useQueryClient()
  const pushToast = useUiStore((state) => state.pushToast)
  return useMutation({
    mutationFn: (input: CreateBranchInput) => createBranch(agencyId, input),
    onSuccess: (branch) => {
      pushToast({ kind: 'success', title: 'Branch created', body: branch.name })
      void queryClient.invalidateQueries({ queryKey: agencyKeys.all })
      void queryClient.invalidateQueries({ queryKey: BRANCHES_QUERY_KEY })
    },
  })
}
