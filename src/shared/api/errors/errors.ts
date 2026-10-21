import { ApiError } from '../client/index.ts'

/**
 * Normalises any thrown value into an `ApiError` that is safe to show. Unknown
 * errors never leak their message to the UI.
 */
export function toApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError(0, 'unexpected_error', 'Something went wrong')
}
