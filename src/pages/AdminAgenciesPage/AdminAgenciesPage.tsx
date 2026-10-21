import './AdminAgenciesPage.scss'
import { Link } from 'react-router'
import { ENTITY_STATUS_LABEL } from '../../entities/agency/model/index.ts'
import { useAgencies } from '../../entities/agency/queries/index.ts'
import { AgencyForm } from '../../features/admin-agencies/AgencyForm/index.ts'
import { useCreateAgency } from '../../features/admin-agencies/use-create-agency/index.ts'
import { toApiError } from '../../shared/api/errors/index.ts'
import { formatTimestamp } from '../../shared/lib/format/index.ts'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'
import { ErrorState } from '../../shared/ui/ErrorState/index.ts'
import { LoadingState } from '../../shared/ui/LoadingState/index.ts'

/** Global admin: every agency, with a form to create the next one. */
export function AdminAgenciesPage() {
  const agencies = useAgencies()
  const create = useCreateAgency()

  return (
    <section className="page" aria-labelledby="agencies-heading">
      <header className="page__header">
        <div>
          <h1 id="agencies-heading">Agencies</h1>
          <p className="muted">Create agencies and manage their branches.</p>
        </div>
      </header>

      <AgencyForm
        key={create.isSuccess ? create.data.id : 'new'}
        pending={create.isPending}
        error={create.error ? toApiError(create.error) : null}
        submitLabel="Create agency"
        onSubmit={(input) => create.mutate(input)}
      />

      <section className="section" aria-labelledby="agencies-list-heading">
        <h2 id="agencies-list-heading">All agencies</h2>
        {agencies.data === undefined ? (
          agencies.isError ? (
            <ErrorState error={toApiError(agencies.error)} onRetry={() => void agencies.refetch()} />
          ) : (
            <LoadingState label="Loading agencies…" />
          )
        ) : agencies.data.length === 0 ? (
          <EmptyState title="No agencies yet">Create the first agency above.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table agency-table" data-testid="agencies-table">
              <thead>
                <tr>
                  <th scope="col">Agency</th>
                  <th scope="col">Status</th>
                  <th scope="col">Branches</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {agencies.data.map((agency) => (
                  <tr key={agency.id} className={agency.status === 'inactive' ? 'agency-table__row--inactive' : undefined}>
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
