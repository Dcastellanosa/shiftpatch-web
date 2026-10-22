import type { CredentialStatus } from '../../../shared/api/client/index.ts'

export type { Credential, CredentialStatus, UploadCredentialInput } from '../../../shared/api/client/index.ts'

/** The credential types the branches require; the first is the default. */
export const CREDENTIAL_TYPES = [
  { code: 'nursing_license', label: 'Nursing licence' },
  { code: 'tb_test', label: 'TB test' },
] as const

/** Mirrors the API's cap (below the hosting platform's request limit); checked before any request. */
export const MAX_CREDENTIAL_BYTES = 4 * 1024 * 1024

export const credentialTypeLabel = (code: string) => CREDENTIAL_TYPES.find((type) => type.code === code)?.label ?? code

export const CREDENTIAL_STATUS_LABEL: Record<CredentialStatus, string> = {
  valid: 'Valid',
  expired: 'Expired',
  revoked: 'Revoked',
}
