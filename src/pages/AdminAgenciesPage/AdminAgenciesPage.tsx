import './AdminAgenciesPage.scss'
import { useState } from 'react'
import { Link } from 'react-router'
import { ENTITY_STATUS_LABEL } from '../../entities/agency/model/index.ts'
import { useAgencies } from '../../entities/agency/queries/index.ts'
import { AgencyForm } from '../../features/admin-agencies/AgencyForm/index.ts'
import { useCreateAgency } from '../../features/admin-agencies/use-create-agency/index.ts'
import { useDeleteAgency } from '../../features/admin-agencies/use-delete-agency/index.ts'
import type { Agency } from '../../shared/api/client/index.ts'
import { toApiError } from '../../shared/api/errors/index.ts'
import { formatTimestamp } from '../../shared/lib/format/index.ts'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog/index.ts'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'
import { ErrorState } from '../../shared/ui/ErrorState/index.ts'
import { LoadingState } from '../../shared/ui/LoadingState/index.ts'
import { Modal } from '../../shared/ui/Modal/index.ts'

/** Global admin: every agency, a modal to create the next one, and deletion with a warning. */
export function AdminAgenciesPage() {
  const agencies = useAgencies()
  const create = useCreateAgency()
  const remove = useDeleteAgency()
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Agency | null>(null)

  function closeCreate() {
    setCreating(false)
    create.reset()
  }

  return (
    <section className="page" aria-labelledby="agencies-heading">
      <header className="page__header">
        <div>
          <h1 id="agencies-heading">Agencies</h1>
          <p className="muted">Create agencies and manage their branches.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setCreating(true)}>
          New agency
        </button>
      </header>

      {creating && (
        <Modal
          title="New agency"
          description="An agency groups branches and the users who manage them."
          onClose={closeCreate}
        >
          <AgencyForm
            pending={create.isPending}
            error={create.error ? toApiError(create.error) : null}
            submitLabel="Create agency"
            onSubmit={(input) => create.mutate(input, { onSuccess: closeCreate })}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          confirmLabel="Delete agency"
          destructive
          pending={remove.isPending}
          onConfirm={() => remove.mutate(deleting, { onSettled: () => setDeleting(null) })}
          onCancel={() => setDeleting(null)}
        >
          This removes the agency, its branches, its users’ memberships and nurse eligibility. It cannot be undone.
          Agencies that already have shifts cannot be deleted; deactivate them instead.
        </ConfirmDialog>
      )}

      <section className="section" aria-labelledby="agencies-list-heading">
        <h2 id="agencies-list-heading">All agencies</h2>
        {agencies.data === undefined ? (
          agencies.isError ? (
            <ErrorState error={toApiError(agencies.error)} onRetry={() => void agencies.refetch()} />
          ) : (
            <LoadingState label="Loading agencies…" />
          )
        ) : agencies.data.length === 0 ? (
          <EmptyState title="No agencies yet">Create the first agency with the button above.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table agency-table" data-testid="agencies-table">
              <thead>
                <tr>
                  <th scope="col">Agency</th>
                  <th scope="col">Status</th>
                  <th scope="col">Branches</th>
                  <th scope="col">Updated</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {agencies.data.map((agency) => (
                  <tr
                    key={agency.id}
                    className={agency.status === 'inactive' ? 'agency-table__row--inactive' : undefined}
                  >
                    <td data-label="Agency" className="table__cell--strong">
                      <Link to={`/admin/agencies/${agency.id}`}>{agency.name}</Link>
                    </td>
                    <td data-label="Status">
                      <span className={`badge badge--${agency.status}`}>{ENTITY_STATUS_LABEL[agency.status]}</span>
                    </td>
                    <td data-label="Branches">{agency.branchCount}</td>
                    <td data-label="Updated">
                      <time dateTime={agency.updatedAt}>{formatTimestamp(agency.updatedAt)}</time>
                    </td>
                    <td className="agency-table__actions">
                      <button
                        type="button"
                        className="btn btn--link agency-table__delete"
                        onClick={() => setDeleting(agency)}
                        disabled={remove.isPending}
                        aria-label={`Delete ${agency.name}`}
                      >
                        Delete
                      </button>
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
