import { useMutation, useQueryClient } from '@tanstack/react-query'
import { agencyKeys } from '../../../entities/agency/queries/index.ts'
import { createAgency, type CreateAgencyInput } from '../../../shared/api/client/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'

/** Creates an active agency, refreshes the agency lists and announces it. */
export function useCreateAgency() {
  const queryClient = useQueryClient()
  const pushToast = useUiStore((state) => state.pushToast)
  return useMutation({
    mutationFn: (input: CreateAgencyInput) => createAgency(input),
    onSuccess: (agency) => {
      pushToast({ kind: 'success', title: 'Agency created', body: `${agency.name} is ready for branches.` })
      void queryClient.invalidateQueries({ queryKey: agencyKeys.all })
    },
  })
}
