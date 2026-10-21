import './ErrorState.scss'
import type { ApiError } from '../../lib/api-client/index.ts'

/** Safe error display: shows the API's user-facing message, never internals. */
export function ErrorState({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  const message =
    error.status === 0
      ? 'The server could not be reached. Check your connection and try again.'
      : error.status === 403
        ? 'You do not have access to this information.'
        : error.message
  return (
    <div className="state state-error" role="alert">
      <p className="state-title">Something went wrong</p>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  )
}
