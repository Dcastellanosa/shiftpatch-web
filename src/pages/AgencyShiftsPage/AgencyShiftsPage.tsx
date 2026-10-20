import './AgencyShiftsPage.css'
import { useState } from 'react'
import { CreateShiftForm } from '../../components/CreateShiftForm/CreateShiftForm.tsx'
import { ShiftTable } from '../../components/ShiftTable/ShiftTable.tsx'
import { EmptyState } from '../../components/EmptyState/EmptyState.tsx'
import { ErrorState } from '../../components/ErrorState/ErrorState.tsx'
import { LoadingState } from '../../components/LoadingState/LoadingState.tsx'
import { listBranches, listShifts, type Shift, type ShiftStatus } from '../../lib/api-client/api-client.ts'
import { setSearchParams, useLocation } from '../../lib/router/router.ts'
import { SHIFT_STATUSES as STATUSES, STATUS_LABEL } from '../../lib/status/status.ts'
import { useAsync } from '../../lib/use-async/use-async.ts'


function parseStatus(value: string | null): ShiftStatus | undefined {
  return STATUSES.find((s) => s === value)
}

export function AgencyShiftsPage() {
  const { search } = useLocation()
  const status = parseStatus(search.get('status'))
  const shifts = useAsync(() => listShifts({ status }), `agency:${status ?? 'all'}`)
  const branches = useAsync(listBranches, 'branches')
  const [created, setCreated] = useState<Shift | null>(null)
  const agencyName = branches.data?.[0]?.agency.name

  return (
    <section className="page" aria-labelledby="agency-heading">
      <header className="page-header">
        <div>
          <h1 id="agency-heading">Agency Shifts</h1>
          <p className="muted">{agencyName ? `${agencyName} · ` : ''}Post open shifts and track who claimed them.</p>
        </div>
      </header>

      {branches.error ? (
        <ErrorState error={branches.error} onRetry={branches.reload} />
      ) : !branches.data ? (
        <LoadingState label="Loading branches…" />
      ) : branches.data.length === 0 ? (
        <EmptyState title="No branches yet">Your agency has no branches to post shifts for.</EmptyState>
      ) : (
        <CreateShiftForm
          branches={branches.data}
          onCreated={(shift) => {
            setCreated(shift)
            shifts.reload()
          }}
        />
      )}

      <div aria-live="polite">
        {created && (
          <div className="notice notice-success">
            <p className="notice-title">Shift created</p>
            <p>
              {created.title} at {created.branch.name} is open for eligible nurses.
            </p>
          </div>
        )}
      </div>

      <section className="section" aria-labelledby="agency-list-heading">
        <div className="section-header">
          <h2 id="agency-list-heading">Shifts</h2>
          <label className="inline-field">
            Status
            <select value={status ?? ''} onChange={(e) => setSearchParams({ status: e.target.value })}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {shifts.error ? (
          <ErrorState error={shifts.error} onRetry={shifts.reload} />
        ) : !shifts.data ? (
          <LoadingState label="Loading shifts…" />
        ) : shifts.data.length === 0 ? (
          <EmptyState title="No shifts match">Create a shift above or change the status filter.</EmptyState>
        ) : (
          <ShiftTable shifts={shifts.data} />
        )}
      </section>
    </section>
  )
}
