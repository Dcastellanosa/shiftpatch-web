import './CreateShiftForm.css'
import { useId, useState, type FormEvent } from 'react'
import { createShift, type ApiError, type Branch, type Shift } from '../../lib/api-client/api-client.ts'
import { toApiError } from '../../lib/errors/errors.ts'
import { addDays, zonedTimeToUtc } from '../../lib/format/format.ts'

interface CreateShiftFormProps {
  branches: Branch[]
  onCreated: (shift: Shift) => void
}

const todayUtc = () => new Date().toISOString().slice(0, 10)

/**
 * Times are entered in the selected branch's local time and sent as UTC. An
 * end time at or before the start time means the shift ends the next day.
 */
export function CreateShiftForm({ branches, onCreated }: CreateShiftFormProps) {
  const ids = { branch: useId(), title: useId(), date: useId(), start: useId(), end: useId(), hint: useId() }
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const branch = branches.find((b) => b.id === branchId)
  const overnight = Boolean(start && end && end <= start)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!branch) return
    const form = event.currentTarget
    const data = new FormData(form)
    const date = String(data.get('date'))
    setSubmitting(true)
    setError(null)
    try {
      const shift = await createShift({
        branchId: branch.id,
        title: String(data.get('title')).trim(),
        startsAt: zonedTimeToUtc(date, start, branch.timezone),
        endsAt: zonedTimeToUtc(overnight ? addDays(date, 1) : date, end, branch.timezone),
      })
      form.reset()
      setStart('')
      setEnd('')
      onCreated(shift)
    } catch (caught) {
      setError(toApiError(caught))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} aria-labelledby={`${ids.title}-legend`}>
      <h2 id={`${ids.title}-legend`}>Create Open Shift</h2>
      <div className="form-grid">
        <div className="field">
          <label htmlFor={ids.branch}>Branch</label>
          <select id={ids.branch} name="branchId" value={branchId} onChange={(e) => setBranchId(e.target.value)} required>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field field-wide">
          <label htmlFor={ids.title}>Title</label>
          <input
            id={ids.title}
            name="title"
            required
            maxLength={200}
            autoComplete="off"
            placeholder="e.g. Med-Surg RN — Day…"
          />
        </div>
        <div className="field">
          <label htmlFor={ids.date}>Date</label>
          <input id={ids.date} name="date" type="date" required min={todayUtc()} />
        </div>
        <div className="field">
          <label htmlFor={ids.start}>Start</label>
          <input id={ids.start} name="start" type="time" required value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={ids.end}>End</label>
          <input
            id={ids.end}
            name="end"
            type="time"
            required
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            aria-describedby={ids.hint}
          />
        </div>
      </div>
      <p id={ids.hint} className="muted small">
        Times are in the branch’s local time{branch ? ` (${branch.timezone})` : ''}.
        {overnight && ' The shift ends the next day.'}
      </p>

      {error && (
        <div className="notice notice-error" role="alert">
          <p className="notice-title">The shift was not created</p>
          <p>
            {error.code === 'validation_error'
              ? 'Check the title, date and times, then try again.'
              : error.message}
          </p>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting || !branch}>
          {submitting ? 'Creating…' : 'Create Shift'}
        </button>
      </div>
    </form>
  )
}
