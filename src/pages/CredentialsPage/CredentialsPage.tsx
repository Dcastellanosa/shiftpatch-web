import './CredentialsPage.scss'
import { CREDENTIAL_STATUS_LABEL, credentialTypeLabel } from '../../entities/credential/model/index.ts'
import { useMyCredentials } from '../../entities/credential/queries/index.ts'
import { CredentialUploadForm } from '../../features/credentials/CredentialUploadForm/index.ts'
import { useUploadCredential } from '../../features/credentials/use-upload-credential/index.ts'
import { toApiError } from '../../shared/api/errors/index.ts'
import { formatLocalDate, formatTimestamp } from '../../shared/lib/format/index.ts'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'
import { ErrorState } from '../../shared/ui/ErrorState/index.ts'
import { LoadingState } from '../../shared/ui/LoadingState/index.ts'

/** The nurse's credential documents: upload (file + expiry) and the current list. */
export function CredentialsPage() {
  const credentials = useMyCredentials()
  const upload = useUploadCredential()

  return (
    <section className="page" aria-labelledby="credentials-heading">
      <header className="page__header">
        <div>
          <h1 id="credentials-heading">Credentials</h1>
          <p className="muted">Keep your licence and screenings current: an expired credential blocks claims.</p>
        </div>
      </header>

      <CredentialUploadForm
        pending={upload.isPending}
        error={upload.error ? toApiError(upload.error) : null}
        onSubmit={(input) => upload.mutate(input)}
      />

      <section className="section" aria-labelledby="credentials-list-heading">
        <h2 id="credentials-list-heading">On file</h2>
        {credentials.data === undefined ? (
          credentials.isError ? (
            <ErrorState error={toApiError(credentials.error)} onRetry={() => void credentials.refetch()} />
          ) : (
            <LoadingState label="Loading credentials…" />
          )
        ) : credentials.data.length === 0 ? (
          <EmptyState title="No credentials yet">Upload your nursing licence to start claiming shifts.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table credentials-table" data-testid="credentials-table">
              <thead>
                <tr>
                  <th scope="col">Credential</th>
                  <th scope="col">Expires</th>
                  <th scope="col">Status</th>
                  <th scope="col">Document</th>
                  <th scope="col">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {credentials.data.map((credential) => (
                  <tr key={credential.id}>
                    <td data-label="Credential" className="table__cell--strong">
                      {credentialTypeLabel(credential.type)}
                    </td>
                    <td data-label="Expires">
                      <time dateTime={credential.expiresAt}>{formatLocalDate(credential.expiresAt)}</time>
                    </td>
                    <td data-label="Status">
                      <span className={`badge badge--credential-${credential.status}`}>
                        {CREDENTIAL_STATUS_LABEL[credential.status]}
                      </span>
                    </td>
                    <td data-label="Document">
                      {credential.fileName ?? <span className="muted">No document on file</span>}
                    </td>
                    <td data-label="Uploaded">
                      {credential.uploadedAt ? (
                        <time dateTime={credential.uploadedAt}>{formatTimestamp(credential.uploadedAt)}</time>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}
