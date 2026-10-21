import './BranchForm.scss'
import { useId, useState, type FormEvent } from 'react'
import { supportedTimezones } from '../../../entities/agency/model/index.ts'
import type { AgencyBranch, ApiError, CreateBranchInput } from '../../../shared/api/client/index.ts'

interface BranchFormProps {
  /** Present when editing; absent when creating. */
  initial?: Pick<AgencyBranch, 'name' | 'address' | 'timezone'>
  pending: boolean
  error: ApiError | null
  submitLabel: string
  onSubmit: (input: CreateBranchInput) => void
  onCancel?: () => void
}

const TIMEZONES = supportedTimezones()

/** Name, address and time zone of a branch. Times of its shifts are entered in that zone. */
export function BranchForm({ initial, pending, error, submitLabel, onSubmit, onCancel }: BranchFormProps) {
  const ids = { legend: useId(), name: useId(), address: useId(), timezone: useId(), error: useId(), hint: useId() }
  const [name, setName] = useState(initial?.name ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [timezone, setTimezone] = useState(
    initial?.timezone ?? (TIMEZONES.includes('America/New_York') ? 'America/New_York' : 'UTC'),
  )
  const nameTaken = error?.code === 'name_taken'
  const input = { name: name.trim(), address: address.trim(), timezone }
  const unchanged = initial
    ? input.name === initial.name && input.address === initial.address && input.timezone === initial.timezone
    : false

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!input.name || !input.address) return
    onSubmit(input)
  }

  return (
    <form className="card form branch-form" onSubmit={handleSubmit} aria-labelledby={ids.legend}>
      <h3 id={ids.legend}>{initial ? `Edit ${initial.name}` : 'New branch'}</h3>
      <div className="branch-form__grid">
        <div className="field">
          <label htmlFor={ids.name}>Branch name</label>
          <input
            id={ids.name}
            name="name"
            required
            maxLength={200}
            autoComplete="off"
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
        <div className="field branch-form__wide">
          <label htmlFor={ids.address}>Address</label>
          <input
            id={ids.address}
            name="address"
            required
            maxLength={500}
            autoComplete="street-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={ids.timezone}>Time zone</label>
          <select
            id={ids.timezone}
            name="timezone"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            aria-describedby={ids.hint}
          >
            {TIMEZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p id={ids.hint} className="muted small">
        Shift times at this branch are entered in its local time zone.
      </p>
      {error && !nameTaken && (
        <div className="notice notice--error" role="alert">
          <p className="notice__title">The branch was not saved</p>
          <p>{error.status === 0 ? 'The server could not be reached. Try again.' : error.message}</p>
        </div>
      )}
      <div className="form__actions">
        {onCancel && (
          <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn--primary"
          disabled={pending || !input.name || !input.address || unchanged}
        >
          {pending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
