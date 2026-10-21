import './ErrorBoundary.scss'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  failed: boolean
}

/**
 * Last line of defence for rendering errors. Shows fixed copy only: nothing
 * about the error reaches the screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled rendering error', error, info.componentStack)
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="error-boundary">
          <div className="state state--error" role="alert">
            <p className="state__title">Something went wrong</p>
            <p>Reload the page to try again.</p>
            <button type="button" className="btn btn--secondary" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
