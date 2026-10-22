/**
 * The access token holder: a module-level closure, nothing else. The token
 * exists only here, in memory, for the lifetime of the page. It is never
 * written to any browser storage, cookie, query cache, UI store, URL or
 * console, and it is never exposed as a value: the only way out is the
 * `Authorization` header the API client adds. A reload starts anonymous;
 * the user signs in again.
 */

let accessToken: string | null = null
const sessionLostListeners = new Set<() => void>()

export function setAccessToken(token: string): void {
  accessToken = token
}

export function clearAccessToken(): void {
  accessToken = null
}

export function hasAccessToken(): boolean {
  return accessToken !== null
}

/** The headers a request needs to prove the session: `{}` while anonymous. */
export function authorizationHeaders(): Record<string, string> {
  return accessToken === null ? {} : { Authorization: `Bearer ${accessToken}` }
}

/** Called when a protected request answers 401: the session is gone and the UI must sign out locally. */
export function onSessionLost(listener: () => void): () => void {
  sessionLostListeners.add(listener)
  return () => {
    sessionLostListeners.delete(listener)
  }
}

export function notifySessionLost(): void {
  for (const listener of [...sessionLostListeners]) listener()
}
