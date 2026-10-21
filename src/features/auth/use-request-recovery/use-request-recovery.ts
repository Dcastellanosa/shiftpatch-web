import { useMutation } from '@tanstack/react-query'
import { requestRecovery } from '../../../shared/api/client/index.ts'

/** Asks the API to email a recovery link. The outcome never reveals whether the address exists. */
export function useRequestRecovery() {
  return useMutation({ mutationFn: (email: string) => requestRecovery(email) })
}
