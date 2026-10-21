import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { BrowserRouter } from 'react-router'
import { createQueryClient } from '../src/app/providers/query-client/index.ts'
import { SessionProvider } from '../src/features/auth/SessionProvider/index.ts'

/** The production client minus retries, so failures surface immediately. */
export function createTestQueryClient() {
  return createQueryClient({ retry: false })
}

interface ProviderOptions {
  /** Starting URL (path + query), as the app would read it from the address bar. */
  path?: string
  /** Also mount `SessionProvider` (it calls `GET /api/auth/me`). */
  session?: boolean
  queryClient?: QueryClient
}

/** Wrapper for `renderHook` and `render`: router + query client (+ session). */
export function withProviders({
  session = false,
  queryClient = createTestQueryClient(),
}: Omit<ProviderOptions, 'path'> = {}) {
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
    queryClient = createTestQueryClient(),
    ...options
  }: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  window.history.replaceState(null, '', path)
  return { ...render(ui, { wrapper: withProviders({ session, queryClient }), ...options }), queryClient }
}
