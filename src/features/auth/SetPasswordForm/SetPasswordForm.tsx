import './SetPasswordForm.scss'
import { useId, useState, type FormEvent } from 'react'
import type { ApiError, PasswordLinkType } from '../../../shared/api/client/index.ts'

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72

interface SetPasswordFormProps {
  type: PasswordLinkType
  pending: boolean
  error: ApiError | null
  onSubmit: (password: string) => void
}

/** Password + confirmation. Only the password leaves this component; the link token is handled by the page. */
export function SetPasswordForm({ type, pending, error, onSubmit }: SetPasswordFormProps) {
  const ids = { password: useId(), confirm: useId(), hint: useId(), mismatch: useId() }
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const mismatch = confirm !== '' && confirm !== password
  const tooShort = password.length > 0 && password.length < PASSWORD_MIN_LENGTH
  const ready = password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH && confirm === password
  const weak = error?.code === 'weak_password'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ready) return
    onSubmit(password)
  }

  return (
    <form className="form set-password-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor={ids.password}>{type === 'recovery' ? 'New password' : 'Password'}</label>
        <input
          id={ids.password}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={weak || tooShort || undefined}
          aria-describedby={ids.hint}
        />
        <p id={ids.hint} className={weak ? 'field__error' : 'muted small'} role={weak ? 'alert' : undefined}>
          {weak ? error.message : `At least ${PASSWORD_MIN_LENGTH} characters.`}
        </p>
      </div>
      <div className="field">
        <label htmlFor={ids.confirm}>Confirm password</label>
        <input
          id={ids.confirm}
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          maxLength={PASSWORD_MAX_LENGTH}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          aria-invalid={mismatch || undefined}
          aria-describedby={mismatch ? ids.mismatch : undefined}
        />
        {mismatch && (
          <p id={ids.mismatch} className="field__error">
            The passwords do not match.
          </p>
        )}
      </div>
      {error && !weak && (
        <div className="notice notice--error" role="alert">
          <p className="notice__title">
            {error.code === 'invalid_or_expired_link' ? 'This link no longer works' : 'The password was not saved'}
          </p>
          <p>{error.status === 0 ? 'The server could not be reached. Try again.' : error.message}</p>
        </div>
      )}
      <button type="submit" className="btn btn--primary btn--block" disabled={pending || !ready}>
        {pending ? 'Saving…' : type === 'recovery' ? 'Save new password' : 'Set password and sign in'}
      </button>
    </form>
  )
}
