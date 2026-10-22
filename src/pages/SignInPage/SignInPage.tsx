import { useState, type FormEvent } from 'react'
import { ForgotPasswordForm } from '../../features/auth/ForgotPasswordForm/index.ts'
import { useSession } from '../../features/auth/session-context/index.ts'

export function SignInPage() {
  const { login, error } = useSession()
  const [submitting, setSubmitting] = useState(false)
  const [forgot, setForgot] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    await login(String(form.get('email') ?? ''), String(form.get('password') ?? ''))
    setSubmitting(false)
  }

  return (
    <main id="main" className="auth-page">
      <div className="auth-page__card card">
        <p className="brand brand--lg" translate="no">
          <span className="brand__mark" aria-hidden="true">
            +
          </span>
          ShiftPatch
        </p>
        <h1>{forgot ? 'Reset your password' : 'Sign In'}</h1>
        <p className="muted">
          {forgot ? 'We will email you a link to choose a new one.' : 'Nursing shifts, staffed safely.'}
        </p>
        {forgot ? (
          <ForgotPasswordForm onBack={() => setForgot(false)} />
        ) : (
          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                spellCheck={false}
                required
                data-testid="login-email-input"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                data-testid="login-password-input"
              />
            </div>
            {error && (
              <p role="alert" className="notice notice--error">
                {error.status === 0 ? 'The server could not be reached. Try again.' : error.message}
              </p>
            )}
            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={submitting}
              data-testid="login-submit-button"
            >
              {submitting ? 'Signing In…' : 'Sign In'}
            </button>
            <button type="button" className="btn btn--link auth-page__link" onClick={() => setForgot(true)}>
              Forgot your password?
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
