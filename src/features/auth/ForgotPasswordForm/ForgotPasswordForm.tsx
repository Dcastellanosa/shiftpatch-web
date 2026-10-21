import './ForgotPasswordForm.scss'
import { useId, useState, type FormEvent } from 'react'
import { toApiError } from '../../../shared/api/errors/index.ts'
import { useRequestRecovery } from '../use-request-recovery/index.ts'

interface ForgotPasswordFormProps {
  onBack: () => void
}

/** Asks for a recovery email. The confirmation reads the same whether or not the address exists. */
export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const emailId = useId()
  const [email, setEmail] = useState('')
  const recovery = useRequestRecovery()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim()) return
    recovery.mutate(email.trim())
  }

  if (recovery.isSuccess) {
    return (
      <div className="forgot-password" role="status">
        <p className="forgot-password__done">Check your email</p>
        <p className="muted">
          If an account exists for that address, a link to set a new password is on its way. It expires after a short
          while.
        </p>
        <button type="button" className="btn btn--link" onClick={onBack}>
          Back to sign in
        </button>
      </div>
    )
  }

  const error = recovery.error ? toApiError(recovery.error) : null
  return (
    <form className="form forgot-password" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor={emailId}>Email</label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="username"
          spellCheck={false}
          required
          maxLength={320}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="notice notice--error">
          {error.status === 0 ? 'The server could not be reached. Try again.' : error.message}
        </p>
      )}
      <button type="submit" className="btn btn--primary btn--block" disabled={recovery.isPending || !email.trim()}>
        {recovery.isPending ? 'Sending…' : 'Email me a link'}
      </button>
      <button
        type="button"
        className="btn btn--link forgot-password__back"
        onClick={onBack}
        disabled={recovery.isPending}
      >
        Back to sign in
      </button>
    </form>
  )
}
