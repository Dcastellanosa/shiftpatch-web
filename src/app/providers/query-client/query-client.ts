import { QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '../../../shared/api/client/index.ts'
import { toApiError } from '../../../shared/api/errors/index.ts'
import { useUiStore } from '../../../stores/ui-store/index.ts'

/** Operational data (shifts, branches, events) counts as fresh for this long. */
export const OPERATIONAL_STALE_TIME = 30_000

/** Network failures are retried at most this many times; HTTP errors are final. */
export const MAX_NETWORK_RETRIES = 2

export function retryNetworkFailuresOnly(failureCount: number, error: unknown): boolean {
  return error instanceof ApiError && error.status === 0 && failureCount < MAX_NETWORK_RETRIES
}

export interface QueryClientOptions {
  /** `false` in tests so failures surface immediately. */
  retry?: boolean
  /** Called when a refresh fails for a query that already shows data. */
  onBackgroundError?: (error: ApiError) => void
}

function notifyBackgroundError(error: ApiError) {
  useUiStore.getState().pushToast({
    kind: 'error',
    title: 'Could not refresh',
    body: error.status === 0 ? 'The server could not be reached. Showing the last loaded data.' : error.message,
  })
}

/**
 * The application's single in-memory cache. No persister is ever attached:
 * server state lives only for the page's lifetime and is cleared on logout.
 */
export function createQueryClient({ retry = true, onBackgroundError = notifyBackgroundError }: QueryClientOptions = {}): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // First loads render their own error state; only background refreshes notify.
        if (query.state.data !== undefined) onBackgroundError(toApiError(error))
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: OPERATIONAL_STALE_TIME,
        retry: retry ? retryNetworkFailuresOnly : false,
      },
      mutations: { retry: false },
    },
  })
}
