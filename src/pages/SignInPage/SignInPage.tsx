import './SignInPage.scss'
import { useState, type FormEvent } from 'react'
import { useSession } from '../../auth/session-context/session-context.ts'

export function SignInPage() {
  const { login, error } = useSession()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    await login(String(form.get('email') ?? ''), String(form.get('password') ?? ''))
    setSubmitting(false)
  }

  return (
    <main id="main" className="auth-page">
      <div className="auth-card card">
        <p className="brand brand-lg" translate="no">
          <span className="brand-mark" aria-hidden="true">
            +
          </span>
          ShiftPatch
        </p>
        <h1>Sign In</h1>
        <p className="muted">Nursing shifts, staffed safely.</p>
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" spellCheck={false} required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {error && (
            <p role="alert" className="notice notice-error">
              {error.status === 0 ? 'The server could not be reached. Try again.' : error.message}
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Signing In…' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  )
}
