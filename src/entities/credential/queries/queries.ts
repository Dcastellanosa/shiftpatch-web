import { useQuery } from '@tanstack/react-query'
import { listMyCredentials } from '../../../shared/api/client/index.ts'

export const credentialKeys = {
  all: ['me', 'credentials'] as const,
}

/** The signed-in nurse's credential documents. */
export function useMyCredentials() {
  return useQuery({ queryKey: credentialKeys.all, queryFn: listMyCredentials })
}
