import './Toaster.scss'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { useUiStore, type Toast } from '../../../stores/ui-store/index.ts'

/** Long enough to read and to act on the link; never shorter than 8 s. */
const AUTO_DISMISS_MS = 8_000

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div className={`toast toast--${toast.kind}`} data-testid="notification-banner">
      <div className="toast__content">
        <p className="toast__title">{toast.title}</p>
        {(toast.body || toast.link) && (
          <p className="toast__body">
            {toast.body && <span>{toast.body}</span>}
            {toast.link && <Link to={toast.link.to}>{toast.link.label}</Link>}
          </p>
        )}
      </div>
      <button
        type="button"
        className="toast__dismiss"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
      >
        ×
      </button>
    </div>
  )
}

/** Renders the global notification queue as a polite live region. */
export function Toaster() {
  const toasts = useUiStore((state) => state.toasts)
  const dismissToast = useUiStore((state) => state.dismissToast)

  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  )
}
