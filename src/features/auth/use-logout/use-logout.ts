import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logout } from '../../../shared/api/client/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'

/**
 * Ends the session through the API.
 *
 * The cache is cleared in `onSettled`, so also when the API call fails: the
 * user asked to leave, and nothing from their session may stay in memory on
 * a shared device regardless of what the server answered. The session query
 * then re-asks `GET /api/auth/me`, the only truth: if the cookies are still
 * valid (the logout request never reached the API) the user stays signed in
 * and sees a notification; otherwise the sign-in form appears.
 */
export function useLogout() {
  const queryClient = useQueryClient()
  const pushToast = useUiStore((state) => state.pushToast)
  return useMutation({
    mutationFn: logout,
    onError: () => {
      pushToast({
        kind: 'error',
        title: 'Could not sign out',
        body: 'The server did not confirm the sign-out. Try again.',
      })
    },
    onSettled: () => {
      queryClient.clear()
    },
  })
}
