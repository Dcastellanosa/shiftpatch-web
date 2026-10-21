import { hashKey, useMutation, useQueryClient } from '@tanstack/react-query'
import { completePassword, type CompletePasswordInput } from '../../../shared/api/client/index.ts'
import { SESSION_QUERY_KEY } from '../use-session-query/index.ts'

/**
 * Sets the password behind a link and, once the API has accepted it and set
 * its cookies, replaces the cache with the new session, like a login.
 *
 * Unlike `useLogin`, this mutation runs outside `SessionProvider`, so the
 * session query is overwritten in place (which notifies its observer) after
 * every other query has been dropped, instead of clearing the whole cache.
 */
export function useCompletePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CompletePasswordInput) => completePassword(input),
    onSuccess: (user) => {
      const sessionHash = hashKey(SESSION_QUERY_KEY)
      queryClient.removeQueries({ predicate: (query) => query.queryHash !== sessionHash })
      queryClient.setQueryData(SESSION_QUERY_KEY, user)
    },
  })
}
