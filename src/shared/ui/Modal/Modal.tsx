import './Modal.scss'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface ModalProps {
  title: string
  /** Short line under the title. */
  description?: string
  children: ReactNode
  /** Called on Escape, on the close button and on a backdrop click. */
  onClose: () => void
}

/** Accessible dialog for a form: labelled, modal, focus moved inside, Escape and backdrop close it. */
export function Modal({ title, description, children, onClose }: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>('input, select, textarea, button:not([data-modal-close])')
    ;(first ?? panel)?.focus()
  }, [])

  return (
    <div className="modal-dialog" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={panelRef}
        className="modal-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            onClose()
          }
        }}
      >
        <header className="modal-dialog__header">
          <div>
            <h2 id={titleId} className="modal-dialog__title">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="muted modal-dialog__description">
                {description}
              </p>
            )}
          </div>
          <button type="button" className="btn btn--ghost modal-dialog__close" onClick={onClose} aria-label="Close" data-modal-close>
            ×
          </button>
        </header>
        <div className="modal-dialog__body">{children}</div>
      </div>
    </div>
  )
}
