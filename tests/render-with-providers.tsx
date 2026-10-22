import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { BrowserRouter } from 'react-router'
import { createQueryClient } from '../src/app/providers/query-client/index.ts'
import { SessionProvider } from '../src/features/auth/SessionProvider/index.ts'
import { SESSION_QUERY_KEY } from '../src/features/auth/use-session-query/index.ts'
import type { SessionUser } from '../src/shared/api/client/index.ts'
import { setAccessToken } from '../src/shared/api/token/index.ts'
import { TEST_TOKEN } from './fake-api.ts'

/** The production client minus retries, so failures surface immediately. */
export function createTestQueryClient() {
  return createQueryClient({ retry: false })
}

interface ProviderOptions {
  /** Starting URL (path + query), as the app would read it from the address bar. */
  path?: string
  /** Also mount `SessionProvider`. */
  session?: boolean
  /** Start signed in as this user: the token holder and the `['session']` query are seeded as a login would. */
  user?: SessionUser | null
  queryClient?: QueryClient
}

function seedSession(queryClient: QueryClient, user: SessionUser | null | undefined) {
  if (!user) return
  setAccessToken(TEST_TOKEN)
  queryClient.setQueryData(SESSION_QUERY_KEY, user)
}

/** Wrapper for `renderHook` and `render`: router + query client (+ session). */
export function withProviders({
  session = false,
  user,
  queryClient = createTestQueryClient(),
}: Omit<ProviderOptions, 'path'> = {}) {
  seedSession(queryClient, user)
  return function Providers({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{session ? <SessionProvider>{children}</SessionProvider> : children}</BrowserRouter>
      </QueryClientProvider>
    )
  }
}

export function renderWithProviders(
  ui: ReactElement,
  {
    path = '/',
    session = false,
    user,
    queryClient = createTestQueryClient(),
    ...options
  }: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  window.history.replaceState(null, '', path)
  return { ...render(ui, { wrapper: withProviders({ session, user, queryClient }), ...options }), queryClient }
}
