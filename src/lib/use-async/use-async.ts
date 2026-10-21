import { useEffect, useState } from 'react'
import type { ApiError } from '../api-client/index.ts'
import { toApiError } from '../errors/index.ts'

export interface AsyncState<T> {
  loading: boolean
  data: T | undefined
  error: ApiError | null
  reload: () => void
}

/**
 * Loads data for `key` and reloads whenever `key` changes or `reload()` is
 * called. Previous data stays visible while a reload is in flight.
 */
export function useAsync<T>(load: () => Promise<T>, key: string): AsyncState<T> {
  const [version, setVersion] = useState(0)
  const requestKey = `${key}#${version}`
  const [result, setResult] = useState<{ key: string; data?: T; error: ApiError | null } | null>(null)

  useEffect(() => {
    let cancelled = false
    load().then(
      (data) => {
        if (!cancelled) setResult({ key: requestKey, data, error: null })
      },
      (error: unknown) => {
        if (!cancelled) setResult({ key: requestKey, error: toApiError(error) })
      },
    )
    return () => {
      cancelled = true
    }
    // `load` is re-created every render; `requestKey` captures what it depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  return {
    loading: result?.key !== requestKey,
    data: result?.data,
    error: result?.key === requestKey ? result.error : null,
    reload: () => setVersion((v) => v + 1),
  }
}
