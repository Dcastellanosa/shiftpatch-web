import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App/index.ts'
import { SessionProvider } from './auth/SessionProvider/index.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </StrictMode>,
)
