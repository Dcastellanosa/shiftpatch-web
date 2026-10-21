import './AdminAgencyPage.scss'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ENTITY_STATUS_LABEL } from '../../entities/agency/model/index.ts'
import { useAgency } from '../../entities/agency/queries/index.ts'
import { AgencyForm } from '../../features/admin-agencies/AgencyForm/index.ts'
import { BranchForm } from '../../features/admin-agencies/BranchForm/index.ts'
import { StatusToggle } from '../../features/admin-agencies/StatusToggle/index.ts'
import { useCreateBranch } from '../../features/admin-agencies/use-create-branch/index.ts'
import { useDeleteAgency } from '../../features/admin-agencies/use-delete-agency/index.ts'
import { useUpdateAgency } from '../../features/admin-agencies/use-update-agency/index.ts'
import { useUpdateBranch } from '../../features/admin-agencies/use-update-branch/index.ts'
import type { AgencyBranch } from '../../shared/api/client/index.ts'
import { toApiError } from '../../shared/api/errors/index.ts'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog/index.ts'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'
import { ErrorState } from '../../shared/ui/ErrorState/index.ts'
import { LoadingState } from '../../shared/ui/LoadingState/index.ts'

/** Global admin: one agency, its status and name, and its branches. */
export function AdminAgencyPage() {
  const { agencyId = '' } = useParams()
  const detail = useAgency(agencyId)
  const updateAgency = useUpdateAgency(agencyId)
  const createBranch = useCreateBranch(agencyId)
  const updateBranch = useUpdateBranch(agencyId)
  const remove = useDeleteAgency()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (detail.data === undefined) {
    return (
      <section className="page" aria-labelledby="agency-heading">
        <h1 id="agency-heading" className="visually-hidden">
          Agency
        </h1>
        {detail.isError ? (
          <ErrorState error={toApiError(detail.error)} onRetry={() => void detail.refetch()} />
        ) : (
          <LoadingState label="Loading agency…" />
        )}
      </section>
    )
  }

  const { agency, branches } = detail.data
  const pendingBranch = updateBranch.isPending ? updateBranch.variables.branchId : null

  return (
    <section className="page" aria-labelledby="agency-heading">
      <p>
        <Link to="/admin/agencies">← All agencies</Link>
      </p>
      <header className="page__header agency-header">
        <div>
          <h1 id="agency-heading">{agency.name}</h1>
          <p className="muted">
            <span className={`badge badge--${agency.status}`}>{ENTITY_STATUS_LABEL[agency.status]}</span>{' '}
            {branches.length} {branches.length === 1 ? 'branch' : 'branches'}
          </p>
        </div>
        <div className="agency-header__actions">
          <button type="button" className="btn btn--secondary" onClick={() => setRenaming((open) => !open)} aria-expanded={renaming}>
            {renaming ? 'Close' : 'Rename'}
          </button>
          <StatusToggle kind="agency" name={agency.name} status={agency.status} pending={updateAgency.isPending} onChange={(status) => updateAgency.mutate({ status })} />
          <button type="button" className="btn btn--secondary agency-header__delete" onClick={() => setConfirmingDelete(true)} disabled={remove.isPending}>
            {remove.isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </header>

      {confirmingDelete && (
        <ConfirmDialog
          title={`Delete ${agency.name}?`}
          confirmLabel="Delete agency"
          destructive
          pending={remove.isPending}
          onConfirm={() =>
            remove.mutate(agency, {
              onSuccess: () => void navigate('/admin/agencies', { replace: true }),
              onSettled: () => setConfirmingDelete(false),
            })
          }
          onCancel={() => setConfirmingDelete(false)}
        >
          This removes the agency, its {branches.length} {branches.length === 1 ? 'branch' : 'branches'}, its users’ memberships and nurse
          eligibility. It cannot be undone. Agencies that already have shifts cannot be deleted; deactivate them instead.
        </ConfirmDialog>
      )}

      {agency.status === 'inactive' && (
        <div className="notice notice--error" role="status">
          <p className="notice__title">This agency is inactive</p>
          <p>Its branches cannot take shifts or claims until it is activated again.</p>
        </div>
      )}

      {renaming && (
        <AgencyForm
          key={agency.name}
          initialName={agency.name}
          pending={updateAgency.isPending}
          error={updateAgency.error ? toApiError(updateAgency.error) : null}
          submitLabel="Save name"
          onSubmit={(input) => updateAgency.mutate(input, { onSuccess: () => setRenaming(false) })}
        />
      )}

      <section className="section" aria-labelledby="branches-heading">
        <h2 id="branches-heading">Branches</h2>
        {agency.status === 'active' ? (
          <BranchForm
            key={createBranch.isSuccess ? createBranch.data.id : 'new'}
            pending={createBranch.isPending}
            error={createBranch.error ? toApiError(createBranch.error) : null}
            submitLabel="Create branch"
            onSubmit={(input) => createBranch.mutate(input)}
          />
        ) : (
          <p className="muted">Activate the agency to add branches.</p>
        )}

        {branches.length === 0 ? (
          <EmptyState title="No branches yet">Add the agency’s first branch above.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table branch-table" data-testid="branches-table">
              <thead>
                <tr>
                  <th scope="col">Branch</th>
                  <th scope="col">Address</th>
                  <th scope="col">Time zone</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <BranchRow
                    key={branch.id}
                    branch={branch}
                    editing={editing === branch.id}
                    pending={pendingBranch === branch.id}
                    error={pendingBranch === null && updateBranch.error && editing === branch.id ? toApiError(updateBranch.error) : null}
                    onEdit={() => setEditing(editing === branch.id ? null : branch.id)}
                    onSave={(input) => updateBranch.mutate({ branchId: branch.id, input }, { onSuccess: () => setEditing(null) })}
                    onStatus={(status) => updateBranch.mutate({ branchId: branch.id, input: { status } })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}

interface BranchRowProps {
  branch: AgencyBranch
  editing: boolean
  pending: boolean
  error: ReturnType<typeof toApiError> | null
  onEdit: () => void
  onSave: (input: Pick<AgencyBranch, 'name' | 'address' | 'timezone'>) => void
  onStatus: (status: AgencyBranch['status']) => void
}

function BranchRow({ branch, editing, pending, error, onEdit, onSave, onStatus }: BranchRowProps) {
  return (
    <>
      <tr className={branch.status === 'inactive' ? 'branch-table__row--inactive' : undefined}>
        <td data-label="Branch" className="table__cell--strong">
          {branch.name}
        </td>
        <td data-label="Address">{branch.address}</td>
        <td data-label="Time zone">{branch.timezone}</td>
        <td data-label="Status">
          <span className={`badge badge--${branch.status}`}>{ENTITY_STATUS_LABEL[branch.status]}</span>
        </td>
        <td className="branch-table__actions">
          <button type="button" className="btn btn--link" onClick={onEdit} aria-expanded={editing} aria-controls={`branch-edit-${branch.id}`}>
            {editing ? 'Close' : 'Edit'}
          </button>
          <StatusToggle kind="branch" name={branch.name} status={branch.status} pending={pending} onChange={onStatus} />
        </td>
      </tr>
      {editing && (
        <tr className="table__history-row">
          <td colSpan={5} id={`branch-edit-${branch.id}`}>
            <BranchForm initial={branch} pending={pending} error={error} submitLabel="Save branch" onSubmit={onSave} onCancel={onEdit} />
          </td>
        </tr>
      )}
    </>
  )
}
