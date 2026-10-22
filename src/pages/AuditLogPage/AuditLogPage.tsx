import './AuditLogPage.scss'
import { useAuditEvents } from '../../entities/audit/queries/index.ts'
import { toApiError } from '../../shared/api/errors/index.ts'
import { formatTimestamp } from '../../shared/lib/format/index.ts'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'
import { ErrorState } from '../../shared/ui/ErrorState/index.ts'
import { LoadingState } from '../../shared/ui/LoadingState/index.ts'

const ACTION_LABEL: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  activated: 'Activated',
  deactivated: 'Deactivated',
  invited: 'Invited',
  deleted: 'Deleted',
  eligibility_activated: 'Eligibility activated',
  eligibility_suspended: 'Eligibility suspended',
  claimed: 'Claimed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No-show',
}

const ENTITY_LABEL: Record<string, string> = {
  agency: 'Agency',
  agency_branch: 'Branch',
  agency_membership: 'Membership',
  branch_nurse_eligibility: 'Eligibility',
  profile: 'User',
  shift: 'Shift',
}

/** The unified audit log: administration actions and shift history, newest first. Admin only. */
export function AuditLogPage() {
  const events = useAuditEvents()

  return (
    <section className="page" aria-labelledby="audit-heading">
      <header className="page__header">
        <div>
          <h1 id="audit-heading">Audit Log</h1>
          <p className="muted">Who did what, when: agencies, branches, users, eligibility and every shift change.</p>
        </div>
      </header>

      {events.data === undefined ? (
        events.isError ? (
          <ErrorState error={toApiError(events.error)} onRetry={() => void events.refetch()} />
        ) : (
          <LoadingState label="Loading the audit log…" />
        )
      ) : events.data.length === 0 ? (
        <EmptyState title="Nothing recorded yet" />
      ) : (
        <div className="table-wrap">
          <table className="table audit-table" data-testid="audit-log-table">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Actor</th>
                <th scope="col">Action</th>
                <th scope="col">Entity</th>
                <th scope="col">Change</th>
                <th scope="col">Reason</th>
              </tr>
            </thead>
            <tbody>
              {events.data.map((event) => (
                <tr key={event.id}>
                  <td data-label="When">
                    <time dateTime={event.occurredAt}>{formatTimestamp(event.occurredAt)}</time>
                  </td>
                  <td data-label="Actor" className="table__cell--strong">
                    {event.actorName ?? event.actorId}
                  </td>
                  <td data-label="Action">{ACTION_LABEL[event.action] ?? event.action}</td>
                  <td data-label="Entity">
                    {ENTITY_LABEL[event.entityType] ?? event.entityType} <span className="muted">{event.entityId}</span>
                  </td>
                  <td data-label="Change">
                    {event.previousStatus || event.newStatus ? (
                      <>
                        {event.previousStatus ?? '—'} → {event.newStatus ?? '—'}
                      </>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td data-label="Reason">{event.reason ?? <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
