import './AgencyShiftsPage.scss'
import { useSearchParams } from 'react-router'
import { useBranches } from '../../entities/branch/use-branches/index.ts'
import { SHIFT_STATUSES as STATUSES, STATUS_LABEL } from '../../entities/shift/model/index.ts'
import { ShiftTable } from '../../entities/shift/ShiftTable/index.ts'
import { CreateShiftForm } from '../../features/agency-management/CreateShiftForm/index.ts'
import { useAgencyShifts } from '../../features/agency-management/use-agency-shifts/index.ts'
import type { ShiftStatus } from '../../shared/api/client/index.ts'
import { toApiError } from '../../shared/api/errors/index.ts'
import { compactParams } from '../../shared/lib/search-params/index.ts'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'
import { ErrorState } from '../../shared/ui/ErrorState/index.ts'
import { LoadingState } from '../../shared/ui/LoadingState/index.ts'

function parseStatus(value: string | null): ShiftStatus | undefined {
  return STATUSES.find((s) => s === value)
}

export function AgencyShiftsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = parseStatus(searchParams.get('status'))
  const shifts = useAgencyShifts(status)
  const branches = useBranches()
  const agencyName = branches.data?.[0]?.agency.name

  return (
    <section className="page" aria-labelledby="agency-heading">
      <header className="page__header">
        <div>
          <h1 id="agency-heading">Agency Shifts</h1>
          <p className="muted">{agencyName ? `${agencyName} · ` : ''}Post open shifts and track who claimed them.</p>
        </div>
      </header>

      {branches.data === undefined ? (
        branches.isError ? (
          <ErrorState error={toApiError(branches.error)} onRetry={() => void branches.refetch()} />
        ) : (
          <LoadingState label="Loading branches…" />
        )
      ) : branches.data.length === 0 ? (
        <EmptyState title="No branches yet">Your agency has no branches to post shifts for.</EmptyState>
      ) : (
        <CreateShiftForm branches={branches.data} />
      )}

      <section className="section" aria-labelledby="agency-list-heading">
        <div className="section__header">
          <h2 id="agency-list-heading">Shifts</h2>
          <label className="inline-field">
            Status
            <select
              value={status ?? ''}
              onChange={(e) => setSearchParams(compactParams({ status: e.target.value }), { replace: true })}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {shifts.data === undefined ? (
          shifts.isError ? (
            <ErrorState error={toApiError(shifts.error)} onRetry={() => void shifts.refetch()} />
          ) : (
            <LoadingState label="Loading shifts…" />
          )
        ) : shifts.data.length === 0 ? (
          <EmptyState title="No shifts match">Create a shift above or change the status filter.</EmptyState>
        ) : (
          <ShiftTable shifts={shifts.data} />
        )}
      </section>
    </section>
  )
}
