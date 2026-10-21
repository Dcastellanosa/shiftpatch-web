import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/styles/index.scss'
import App from './app/App/index.ts'
import { AppProviders } from './app/providers/AppProviders/index.ts'
import { ErrorBoundary } from './shared/ui/ErrorBoundary/index.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
)
