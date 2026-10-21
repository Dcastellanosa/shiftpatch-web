import './ConfirmDialog.scss'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface ConfirmDialogProps {
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** Styles the confirm button as a destructive action. */
  destructive?: boolean
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Keyboard-safe confirmation: focus lands on the confirm button, Escape cancels, nothing closes while pending. */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const bodyId = useId()
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  return (
    <div className="confirm-dialog">
      <div
        className="confirm-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !pending) onCancel()
        }}
      >
        <h2 id={titleId}>{title}</h2>
        <div id={bodyId} className="confirm-dialog__body">
          {children}
        </div>
        <div className="confirm-dialog__actions">
          <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`btn ${destructive ? 'btn--danger' : 'btn--primary'}`}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
