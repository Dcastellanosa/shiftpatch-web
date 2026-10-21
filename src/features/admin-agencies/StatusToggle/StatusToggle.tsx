import './StatusToggle.scss'
import { useState } from 'react'
import type { EntityStatus } from '../../../shared/api/client/index.ts'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog/index.ts'

interface StatusToggleProps {
  /** "agency" or "branch", used in the confirmation copy. */
  kind: 'agency' | 'branch'
  name: string
  status: EntityStatus
  pending: boolean
  onChange: (status: EntityStatus) => void
}

const CONSEQUENCES: Record<'agency' | 'branch', string> = {
  agency:
    'Its branches stop taking new shifts and claims, and nurses no longer see their open shifts, until it is activated again.',
  branch:
    'It stops taking new shifts and claims, and nurses no longer see its open shifts, until it is activated again.',
}

/** Activate / deactivate with a confirmation step; the API performs the change atomically. */
export function StatusToggle({ kind, name, status, pending, onChange }: StatusToggleProps) {
  const [confirming, setConfirming] = useState(false)
  const next: EntityStatus = status === 'active' ? 'inactive' : 'active'
  const verb = next === 'inactive' ? 'Deactivate' : 'Activate'

  return (
    <>
      <button
        type="button"
        className="btn btn--secondary status-toggle"
        onClick={() => setConfirming(true)}
        disabled={pending}
      >
        {pending ? 'Saving…' : verb}
      </button>
      {confirming && (
        <ConfirmDialog
          title={`${verb} ${name}?`}
          confirmLabel={verb}
          destructive={next === 'inactive'}
          pending={pending}
          onConfirm={() => {
            setConfirming(false)
            onChange(next)
          }}
          onCancel={() => setConfirming(false)}
        >
          {next === 'inactive' ? CONSEQUENCES[kind] : `The ${kind} can take shifts again.`}
        </ConfirmDialog>
      )}
    </>
  )
}
