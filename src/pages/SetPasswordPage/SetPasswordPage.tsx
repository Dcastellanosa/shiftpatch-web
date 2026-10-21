import './SetPasswordPage.scss'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { readPasswordLink } from '../../features/auth/password-link/index.ts'
import { SetPasswordForm } from '../../features/auth/SetPasswordForm/index.ts'
import { useCompletePassword } from '../../features/auth/use-complete-password/index.ts'
import { toApiError } from '../../shared/api/errors/index.ts'

/**
 * Public landing page of invitation and recovery emails. The link's token is
 * read from the URL fragment once, removed from the address bar, and sent to
 * the API together with the chosen password. On success the API has set the
 * session cookies and the app continues at the user's home screen.
 */
export function SetPasswordPage() {
  const [link] = useState(readPasswordLink)
  const navigate = useNavigate()
  const complete = useCompletePassword()

  return (
    <main id="main" className="auth-page">
      <div className="auth-page__card card set-password">
        <p className="brand brand--lg" translate="no">
          <span className="brand__mark" aria-hidden="true">
            +
          </span>
          ShiftPatch
        </p>
        {link ? (
          <>
            <h1>{link.type === 'recovery' ? 'Choose a new password' : 'Welcome to ShiftPatch'}</h1>
            <p className="muted">
              {link.type === 'recovery' ? 'Set a new password for your account.' : 'Set a password to finish creating your account.'}
            </p>
            <SetPasswordForm
              type={link.type}
              pending={complete.isPending}
              error={complete.error ? toApiError(complete.error) : null}
              onSubmit={(password) =>
                complete.mutate({ tokenHash: link.tokenHash, type: link.type, password }, { onSuccess: () => void navigate('/', { replace: true }) })
              }
            />
          </>
        ) : (
          <>
            <h1>This link is incomplete</h1>
            <p className="muted">Open the link from your email again, or ask for a new one from the sign-in page.</p>
          </>
        )}
        <p className="set-password__footer">
          <Link to="/" replace>
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
