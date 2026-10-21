import './EligibilityToggle.scss'
import { ELIGIBILITY_STATUS_LABEL } from '../../../entities/user/model/index.ts'
import type { EligibilityStatus } from '../../../shared/api/client/index.ts'

interface EligibilityToggleProps {
  nurseName: string
  branchName: string
  /** `null` when the nurse has no record at this branch yet. */
  status: EligibilityStatus | null
  /** Inactive branches cannot change; the API rejects them too. */
  disabled: boolean
  pending: boolean
  onChange: (status: 'active' | 'suspended') => void
}

/** Status badge plus the single action that moves it: activate, or suspend. */
export function EligibilityToggle({
  nurseName,
  branchName,
  status,
  disabled,
  pending,
  onChange,
}: EligibilityToggleProps) {
  const next = status === 'active' ? 'suspended' : 'active'
  const verb = next === 'active' ? 'Activate' : 'Suspend'
  return (
    <span className="eligibility-toggle">
      <span className={`badge badge--eligibility-${status ?? 'none'}`}>
        {status ? ELIGIBILITY_STATUS_LABEL[status] : 'Not eligible'}
      </span>
      <button
        type="button"
        className="btn btn--link eligibility-toggle__action"
        onClick={() => onChange(next)}
        disabled={disabled || pending}
        aria-label={`${verb} ${nurseName} at ${branchName}`}
      >
        {pending ? 'Saving…' : verb}
      </button>
    </span>
  )
}
