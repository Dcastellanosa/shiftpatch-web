import { useMutation, useQueryClient } from '@tanstack/react-query'
import { credentialKeys } from '../../../entities/credential/queries/index.ts'
import { shiftKeys } from '../../../entities/shift/queries/index.ts'
import { uploadCredential, type UploadCredentialInput } from '../../../shared/api/client/index.ts'
import { toApiError } from '../../../shared/api/errors/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'

/** Uploads a credential document through the API; a renewed licence changes what the nurse may claim. */
export function useUploadCredential() {
  const queryClient = useQueryClient()
  const pushToast = useUiStore((state) => state.pushToast)
  return useMutation({
    mutationFn: (input: UploadCredentialInput) => uploadCredential(input),
    onSuccess: (credential) => {
      pushToast({
        kind: 'success',
        title: 'Credential uploaded',
        body: `${credential.fileName ?? 'Document'} saved, valid until ${credential.expiresAt}.`,
      })
      void queryClient.invalidateQueries({ queryKey: credentialKeys.all })
      void queryClient.invalidateQueries({ queryKey: shiftKeys.all })
    },
    onError: (error) => {
      const failure = toApiError(error)
      pushToast({
        kind: 'error',
        title: 'Credential not uploaded',
        body: failure.status === 0 ? 'The server could not be reached. Try again.' : failure.message,
      })
    },
  })
}
