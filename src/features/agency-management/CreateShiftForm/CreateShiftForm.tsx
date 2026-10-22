import './CreateShiftForm.scss'
import { useId, useState, type FormEvent } from 'react'
import type { Branch, Shift } from '../../../shared/api/client/index.ts'
import { toApiError } from '../../../shared/api/errors/index.ts'
import { isOvernight } from '../../../shared/lib/format/index.ts'
import { useCreateShift } from '../use-create-shift/index.ts'

interface CreateShiftFormProps {
  /** The agency's branches; a branch picker appears only when there are several. */
  branches: Branch[]
  onCreated?: (shift: Shift) => void
  /** Inside a dialog the heading comes from the dialog. */
  withHeading?: boolean
}

/**
 * The contract's post-shift form: role, facility-local date and times. An end
 * time at or before the start time means the shift ends the next day. Dated
 * shifts are allowed (the trial's sample data is dated).
 */
export function CreateShiftForm({ branches, onCreated, withHeading = true }: CreateShiftFormProps) {
  const ids = { branch: useId(), role: useId(), date: useId(), start: useId(), end: useId(), hint: useId() }
  const [branchId, setBranchId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const create = useCreateShift()

  const overnight = Boolean(start && end && isOvernight(start, end))
  const submitting = create.isPending
  const error = create.error ? toApiError(create.error) : null
  const chooseBranch = branches.length > 1

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    create.mutate(
      {
        role: String(data.get('role')).trim(),
        date: String(data.get('date')),
        startTime: start,
        endTime: end,
        ...(chooseBranch && branchId ? { branchId } : {}),
      },
      {
        onSuccess: (shift) => {
          form.reset()
          setStart('')
          setEnd('')
          onCreated?.(shift)
        },
      },
    )
  }

  return (
    <form
      className={withHeading ? 'card form' : 'form'}
      onSubmit={handleSubmit}
      aria-labelledby={withHeading ? `${ids.role}-legend` : undefined}
    >
      {withHeading && <h2 id={`${ids.role}-legend`}>Post a Shift</h2>}
      <div className="form__grid">
        {chooseBranch && (
          <div className="field">
            <label htmlFor={ids.branch}>Branch</label>
            <select
              id={ids.branch}
              name="branchId"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              required
            >
              <option value="">Choose a branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor={ids.role}>Role</label>
          <input id={ids.role} name="role" required maxLength={200} autoComplete="off" placeholder="e.g. RN" />
        </div>
        <div className="field">
          <label htmlFor={ids.date}>Date</label>
          <input id={ids.date} name="date" type="date" required />
        </div>
        <div className="field">
          <label htmlFor={ids.start}>Start</label>
          <input
            id={ids.start}
            name="startTime"
            type="time"
            required
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={ids.end}>End</label>
          <input
            id={ids.end}
            name="endTime"
            type="time"
            required
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            aria-describedby={ids.hint}
          />
        </div>
      </div>
      <p id={ids.hint} className="muted small">
        Times are the facility's local time.{overnight && ' The shift ends the next day.'}
      </p>

      {error && (
        <div className="notice notice--error" role="alert">
          <p className="notice__title">The shift was not posted</p>
          <p>{error.status === 0 ? 'The server could not be reached. Try again.' : error.message}</p>
        </div>
      )}

      <div className="form__actions">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={submitting}
          data-testid="agency-post-shift-submit-button"
        >
          {submitting ? 'Posting…' : 'Post shift'}
        </button>
      </div>
    </form>
  )
}
