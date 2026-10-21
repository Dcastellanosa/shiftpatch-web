import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ADMIN_USERS_QUERY_KEY } from '../../../entities/user/queries/index.ts'
import { inviteUser, type InviteUserInput } from '../../../shared/api/client/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'

/** Sends an invitation through the API and refreshes the user list. */
export function useInviteUser() {
  const queryClient = useQueryClient()
  const pushToast = useUiStore((state) => state.pushToast)
  return useMutation({
    mutationFn: (input: InviteUserInput) => inviteUser(input),
    onSuccess: (user) => {
      pushToast({
        kind: 'success',
        title: 'Invitation sent',
        body: `${user.fullName} will receive an email to set a password.`,
      })
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
    },
  })
}
