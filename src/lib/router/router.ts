import { useSyncExternalStore } from 'react'

/**
 * Minimal History API router. The app has four role-specific screens, so a
 * routing dependency is not warranted. Vite (dev) and vercel.json (deployed)
 * serve index.html for every non-/api path.
 */

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('popstate', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('popstate', listener)
  }
}

const snapshot = () => window.location.pathname + window.location.search

export function navigate(to: string, options: { replace?: boolean } = {}) {
  if (to === snapshot()) return
  if (options.replace) window.history.replaceState(null, '', to)
  else window.history.pushState(null, '', to)
  for (const listener of listeners) listener()
}

export interface Location {
  pathname: string
  search: URLSearchParams
}

export function useLocation(): Location {
  const href = useSyncExternalStore(subscribe, snapshot, () => '/')
  const url = new URL(href, 'http://localhost')
  return { pathname: url.pathname, search: url.searchParams }
}

/** Replaces the query string (keeps the path), dropping empty values. */
export function setSearchParams(values: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value)
  }
  const query = params.toString()
  navigate(`${window.location.pathname}${query ? `?${query}` : ''}`, { replace: true })
}
