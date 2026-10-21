import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router'
import { SessionProvider } from '../../../features/auth/SessionProvider/index.ts'
import { createQueryClient } from '../query-client/index.ts'

interface AppProvidersProps {
  children: ReactNode
  /** Tests inject a client with retries disabled. */
  queryClient?: QueryClient
}

/** Router, in-memory query cache and session, in that order of dependency. */
export function AppProviders({ children, queryClient }: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient())
  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <SessionProvider>{children}</SessionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
