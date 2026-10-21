import { ApiError } from '../api-client/index.ts'

export function toApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError(0, 'unexpected_error', 'Something went wrong')
}

export interface FriendlyError {
  title: string
  detail: string
}

/** User-facing copy for claim failures, keyed by the API's error codes. */
const CLAIM_MESSAGES: Record<string, FriendlyError> = {
  credential_expired: {
    title: 'A required credential has expired',
    detail:
      'This branch needs a credential that is expired or expires before the shift starts. Renew it with your agency, then try again.',
  },
  credential_missing: {
    title: 'A required credential is missing',
    detail: 'This branch requires a credential that is not on your profile. Ask your agency to add it, then try again.',
  },
  credential_revoked: {
    title: 'A required credential was revoked',
    detail: 'Contact your agency to resolve the credential before claiming shifts at this branch.',
  },
  eligibility_inactive: {
    title: 'You are not active at this branch',
    detail: 'Your eligibility for this branch is pending or suspended. Ask the agency to activate it.',
  },
  shift_not_open: {
    title: 'This shift was already claimed',
    detail: 'Another nurse claimed it first, or it is no longer open. Choose another shift.',
  },
  schedule_conflict: {
    title: 'This overlaps a shift you already have',
    detail: 'You have a claimed shift during this time. Check My Shifts before choosing another one.',
  },
  shift_started: {
    title: 'This shift has already started',
    detail: 'Shifts can only be claimed before they begin.',
  },
  shift_not_found: {
    title: 'This shift is no longer available',
    detail: 'It may have been removed. Refresh the list to see current shifts.',
  },
}

export function describeClaimError(error: ApiError): FriendlyError {
  return (
    CLAIM_MESSAGES[error.code] ?? {
      title: 'The shift could not be claimed',
      detail: error.status === 0 ? 'Check your connection and try again.' : error.message,
    }
  )
}
