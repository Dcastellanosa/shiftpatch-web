import { useMutation, useQueryClient } from '@tanstack/react-query'
import { completePassword, type CompletePasswordInput } from '../../../shared/api/client/index.ts'
import { SESSION_QUERY_KEY } from '../use-session-query/index.ts'

/**
 * Sets the password behind a link and, once the API has accepted it and set
 * its cookies, replaces the cache with the new session, like a login.
 */
export function useCompletePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CompletePasswordInput) => completePassword(input),
    onSuccess: (user) => {
      queryClient.clear()
      queryClient.setQueryData(SESSION_QUERY_KEY, user)
    },
  })
}
