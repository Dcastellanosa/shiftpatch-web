import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login } from '../../../shared/api/client/index.ts'
import { SESSION_QUERY_KEY } from '../use-session-query/index.ts'

export interface Credentials {
  email: string
  password: string
}

/**
 * Signs in through the API. Only after the API has accepted the credentials
 * is the whole cache cleared (nothing from a previous session may survive),
 * immediately before the new session is stored. A failed attempt leaves the
 * cache untouched.
 */
export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ email, password }: Credentials) => login(email, password),
    onSuccess: (user) => {
      queryClient.clear()
      queryClient.setQueryData(SESSION_QUERY_KEY, user)
    },
  })
}
