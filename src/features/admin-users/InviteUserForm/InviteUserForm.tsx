import './InviteUserForm.scss'
import { useId, useState, type FormEvent } from 'react'
import { useAgencies } from '../../../entities/agency/queries/index.ts'
import { useBranches } from '../../../entities/branch/use-branches/index.ts'
import { USER_ROLES, USER_ROLE_LABEL } from '../../../entities/user/model/index.ts'
import type { ApiError, InviteUserInput, UserRole } from '../../../shared/api/client/index.ts'

interface InviteUserFormProps {
  pending: boolean
  error: ApiError | null
  onSubmit: (input: InviteUserInput) => void
}

const FIELD_ERRORS: Partial<Record<string, 'email' | 'assignment'>> = {
  email_exists: 'email',
  invalid_assignment: 'assignment',
  agency_not_found: 'assignment',
  agency_inactive: 'assignment',
  branch_not_found: 'assignment',
  branch_inactive: 'assignment',
}

/**
 * Invitation form whose assignment depends on the role: agency users pick one
 * or more active agencies, nurses pick one active branch, admins nothing else.
 * The API sends the email; nothing about the link ever reaches this screen.
 */
export function InviteUserForm({ pending, error, onSubmit }: InviteUserFormProps) {
  const ids = { legend: useId(), email: useId(), name: useId(), role: useId(), assignment: useId(), error: useId() }
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('nurse')
  const [agencyIds, setAgencyIds] = useState<string[]>([])
  const [branchId, setBranchId] = useState('')
  const agencies = useAgencies()
  const branches = useBranches()
  const activeAgencies = (agencies.data ?? []).filter((agency) => agency.status === 'active')
  const activeBranches = (branches.data ?? []).filter((branch) => branch.status === 'active')
  const field = error ? FIELD_ERRORS[error.code] : undefined
  const complete =
    email.trim() !== '' &&
    fullName.trim() !== '' &&
    (role === 'admin' || (role === 'agency' ? agencyIds.length > 0 : branchId !== ''))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!complete) return
    const base = { email: email.trim(), fullName: fullName.trim() }
    if (role === 'agency') onSubmit({ ...base, role, agencyIds })
    else if (role === 'nurse') onSubmit({ ...base, role, branchId })
    else onSubmit({ ...base, role })
  }

  return (
    <form className="card form invite-form" onSubmit={handleSubmit} aria-labelledby={ids.legend}>
      <h2 id={ids.legend}>Invite a user</h2>
      <div className="invite-form__grid">
        <div className="field">
          <label htmlFor={ids.name}>Full name</label>
          <input
            id={ids.name}
            name="fullName"
            required
            maxLength={200}
            autoComplete="off"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={ids.email}>Email</label>
          <input
            id={ids.email}
            name="email"
            type="email"
            required
            maxLength={320}
            autoComplete="off"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={field === 'email' || undefined}
            aria-describedby={field === 'email' ? ids.error : undefined}
          />
          {field === 'email' && (
            <p id={ids.error} className="field__error" role="alert">
              {error?.message}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor={ids.role}>Role</label>
          <select id={ids.role} name="role" value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
            {USER_ROLES.map((option) => (
              <option key={option} value={option}>
                {USER_ROLE_LABEL[option]}
              </option>
            ))}
          </select>
        </div>
        {role === 'agency' && (
          <div className="field">
            <label htmlFor={ids.assignment}>Agencies</label>
            <select
              id={ids.assignment}
              name="agencyIds"
              multiple
              required
              size={Math.min(Math.max(activeAgencies.length, 2), 6)}
              value={agencyIds}
              onChange={(event) => setAgencyIds(Array.from(event.target.selectedOptions, (option) => option.value))}
              aria-invalid={field === 'assignment' || undefined}
              aria-describedby={field === 'assignment' ? ids.error : undefined}
            >
              {activeAgencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
            <p className="muted small">
              {agencies.isPending ? 'Loading agencies…' : 'Hold Ctrl or ⌘ to select several.'}
            </p>
          </div>
        )}
        {role === 'nurse' && (
          <div className="field">
            <label htmlFor={ids.assignment}>Branch</label>
            <select
              id={ids.assignment}
              name="branchId"
              required
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              aria-invalid={field === 'assignment' || undefined}
              aria-describedby={field === 'assignment' ? ids.error : undefined}
            >
              <option value="">{branches.isPending ? 'Loading branches…' : 'Choose a branch'}</option>
              {activeBranches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.agency.name} · {branch.name}
                </option>
              ))}
            </select>
            <p className="muted small">The nurse becomes eligible at this branch and can be added to others later.</p>
          </div>
        )}
      </div>
      {field === 'assignment' && (
        <p id={ids.error} className="field__error" role="alert">
          {error?.message}
        </p>
      )}
      {error && !field && (
        <div className="notice notice--error" role="alert">
          <p className="notice__title">The invitation was not sent</p>
          <p>{error.status === 0 ? 'The server could not be reached. Try again.' : error.message}</p>
        </div>
      )}
      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={pending || !complete}>
          {pending ? 'Sending…' : 'Send invitation'}
        </button>
      </div>
    </form>
  )
}
