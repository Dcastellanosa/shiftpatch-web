import { useState, type FormEvent } from 'react'
import { useSession } from './auth/session-context.ts'
import './App.css'

// Minimal session shell for exercising authentication. Product screens
// (agency, nurse, admin) are intentionally not implemented yet.
function App() {
  const session = useSession()

  return (
    <main className="shell">
      <h1>ShiftPatch</h1>
      {session.loading ? (
        <p role="status">Checking session…</p>
      ) : session.authenticated ? (
        <SignedIn />
      ) : (
        <SignInForm />
      )}
      {session.error && (
        <p role="alert" className="error">
          {session.error.message}
        </p>
      )}
    </main>
  )
}

function SignedIn() {
  const { user, logout } = useSession()
  return (
    <section className="panel">
      <p>
        Signed in as <strong>{user?.email ?? user?.id}</strong>
      </p>
      <button type="button" onClick={() => void logout()}>
        Sign out
      </button>
    </section>
  )
}

function SignInForm() {
  const { login } = useSession()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    await login(String(form.get('email') ?? ''), String(form.get('password') ?? ''))
    setSubmitting(false)
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <label>
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

export default App
