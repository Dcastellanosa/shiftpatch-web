import { useMutation, useQueryClient } from '@tanstack/react-query'
import { agencyKeys } from '../../../entities/agency/queries/index.ts'
import { ADMIN_USERS_QUERY_KEY } from '../../../entities/user/queries/index.ts'
import { deleteAdminUser, type AdminUser } from '../../../shared/api/client/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'
import { AGENCY_NURSES_QUERY_KEY } from '../../nurse-eligibility/use-agency-nurses/index.ts'

/** Deletes an account after confirmation; the API refuses users with history and self-deletion. */
export function useDeleteUser() {
  const queryClient = useQueryClient()
  const pushToast = useUiStore((state) => state.pushToast)
  return useMutation({
    mutationFn: (user: Pick<AdminUser, 'id' | 'fullName'>) => deleteAdminUser(user.id),
    onSuccess: (_, user) => {
      pushToast({ kind: 'success', title: 'User deleted', body: user.fullName })
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: AGENCY_NURSES_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: agencyKeys.all })
    },
    onError: (error, user) => {
      pushToast({ kind: 'error', title: 'User not deleted', body: `${user.fullName}: ${error.message}` })
    },
  })
}
