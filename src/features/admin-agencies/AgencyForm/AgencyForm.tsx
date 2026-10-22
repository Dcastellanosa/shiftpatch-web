import './AgencyForm.scss'
import { useId, useState, type FormEvent } from 'react'
import type { ApiError } from '../../../shared/api/client/index.ts'

interface AgencyFormProps {
  /** Present when editing; absent when creating. */
  initialName?: string
  pending: boolean
  error: ApiError | null
  submitLabel: string
  onSubmit: (input: { name: string }) => void
}

/** Name form for an agency. A taken name is shown on the field; other failures as a notice. */
export function AgencyForm({ initialName = '', pending, error, submitLabel, onSubmit }: AgencyFormProps) {
  const ids = { name: useId(), error: useId(), legend: useId() }
  const [name, setName] = useState(initialName)
  const nameTaken = error?.status === 409
  const trimmed = name.trim()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!trimmed) return
    onSubmit({ name: trimmed })
  }

  return (
    <form className="card form agency-form" onSubmit={handleSubmit} aria-labelledby={ids.legend}>
      <h2 id={ids.legend}>{initialName ? 'Agency details' : 'New agency'}</h2>
      <div className="field">
        <label htmlFor={ids.name}>Name</label>
        <input
          id={ids.name}
          name="name"
          required
          maxLength={200}
          autoComplete="organization"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={nameTaken || undefined}
          aria-describedby={nameTaken ? ids.error : undefined}
        />
        {nameTaken && (
          <p id={ids.error} className="field__error" role="alert">
            {error.message}
          </p>
        )}
      </div>
      {error && !nameTaken && (
        <div className="notice notice--error" role="alert">
          <p className="notice__title">The agency was not saved</p>
          <p>{error.status === 0 ? 'The server could not be reached. Try again.' : error.message}</p>
        </div>
      )}
      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={pending || !trimmed || trimmed === initialName}>
          {pending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
