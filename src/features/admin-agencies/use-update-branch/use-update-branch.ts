import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BRANCHES_QUERY_KEY } from '../../../entities/branch/use-branches/index.ts'
import { agencyKeys } from '../../../entities/agency/queries/index.ts'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { updateBranch, type UpdateBranchInput } from '../../../shared/api/client/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'

/** Edits, activates or deactivates a branch; status changes also refresh shift data. */
export function useUpdateBranch(agencyId: string) {
  const queryClient = useQueryClient()
  const pushToast = useUiStore((state) => state.pushToast)
  return useMutation({
    mutationFn: ({ branchId, input }: { branchId: string; input: UpdateBranchInput }) =>
      updateBranch(agencyId, branchId, input),
    onSuccess: (branch, { input }) => {
      const title = input.status
        ? input.status === 'active'
          ? 'Branch activated'
          : 'Branch deactivated'
        : 'Branch updated'
      pushToast({ kind: 'success', title, body: branch.name })
      void queryClient.invalidateQueries({ queryKey: agencyKeys.all })
      void queryClient.invalidateQueries({ queryKey: BRANCHES_QUERY_KEY })
      if (input.status) void queryClient.invalidateQueries({ queryKey: shiftKeys.all })
    },
  })
}
