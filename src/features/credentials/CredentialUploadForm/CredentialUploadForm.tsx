import './CredentialUploadForm.scss'
import { useId, useState, type FormEvent } from 'react'
import { CREDENTIAL_TYPES, MAX_CREDENTIAL_BYTES } from '../../../entities/credential/model/index.ts'
import type { ApiError, UploadCredentialInput } from '../../../shared/api/client/index.ts'

interface CredentialUploadFormProps {
  pending: boolean
  error: ApiError | null
  onSubmit: (input: UploadCredentialInput) => void
}

const ACCEPT = '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg'

/** File + expiry date for one credential type. The API validates the bytes and the size (5 MB). */
export function CredentialUploadForm({ pending, error, onSubmit }: CredentialUploadFormProps) {
  const ids = { legend: useId(), type: useId(), file: useId(), expires: useId(), hint: useId() }
  const [type, setType] = useState<string>(CREDENTIAL_TYPES[0].code)
  const [file, setFile] = useState<File | null>(null)
  const [tooLarge, setTooLarge] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const ready = file !== null && !tooLarge && expiresAt !== ''

  function choose(chosen: File | null) {
    const oversized = chosen !== null && chosen.size > MAX_CREDENTIAL_BYTES
    setTooLarge(oversized)
    setFile(oversized ? null : chosen)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ready || !file) return
    onSubmit({ file, expiresAt, credentialTypeCode: type })
  }

  return (
    <form className="card form credential-upload-form" onSubmit={handleSubmit} aria-labelledby={ids.legend}>
      <h2 id={ids.legend}>Upload a credential</h2>
      <div className="credential-upload-form__grid">
        <div className="field">
          <label htmlFor={ids.type}>Credential</label>
          <select id={ids.type} value={type} onChange={(event) => setType(event.target.value)} disabled={pending}>
            {CREDENTIAL_TYPES.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={ids.file}>Document</label>
          <input
            id={ids.file}
            type="file"
            data-testid="credential-upload-input"
            accept={ACCEPT}
            aria-required="true"
            aria-describedby={ids.hint}
            onChange={(event) => choose(event.target.files?.[0] ?? null)}
            disabled={pending}
          />
          {tooLarge && (
            <p className="field__error" role="alert">
              This file is larger than 4 MB. Choose a smaller document.
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor={ids.expires}>Expiry date</label>
          <input
            id={ids.expires}
            type="date"
            data-testid="credential-expiry-date-input"
            required
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            disabled={pending}
          />
        </div>
      </div>
      <p id={ids.hint} className="muted small">
        PDF, PNG or JPEG, up to 4 MB. A new upload replaces the document on file for that credential.
      </p>
      {error && (
        <div className="notice notice--error" role="alert">
          <p className="notice__title">The credential was not uploaded</p>
          <p>{error.status === 0 ? 'The server could not be reached. Try again.' : error.message}</p>
        </div>
      )}
      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={pending || !ready}>
          {pending ? 'Uploading…' : 'Upload credential'}
        </button>
      </div>
    </form>
  )
}
