import './AgencyShiftsPage.scss'
import { useSearchParams } from 'react-router'
import { useBranches } from '../../entities/branch/use-branches/index.ts'
import { SHIFT_STATUSES as STATUSES, STATUS_LABEL } from '../../entities/shift/model/index.ts'
import { ShiftTable } from '../../entities/shift/ShiftTable/index.ts'
import { CreateShiftForm } from '../../features/agency-management/CreateShiftForm/index.ts'
import { useAgencyShifts } from '../../features/agency-management/use-agency-shifts/index.ts'
import { useSession } from '../../features/auth/session-context/index.ts'
import type { ShiftStatus } from '../../shared/api/client/index.ts'
import { toApiError } from '../../shared/api/errors/index.ts'
import { compactParams } from '../../shared/lib/search-params/index.ts'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'
import { ErrorState } from '../../shared/ui/ErrorState/index.ts'
import { LoadingState } from '../../shared/ui/LoadingState/index.ts'

function parseStatus(value: string | null): ShiftStatus | undefined {
  return STATUSES.find((s) => s === value)
}

/** The agency's own shifts (`user.id` is the agency's public id for agency logins). */
export function AgencyShiftsPage() {
  const { user } = useSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const status = parseStatus(searchParams.get('status'))
  const shifts = useAgencyShifts(user?.id ?? '')
  const branches = useBranches()
  const rows = (shifts.data ?? []).filter((shift) => !status || shift.status === status)

  return (
    <section className="page" aria-labelledby="agency-heading">
      <header className="page__header">
        <div>
          <h1 id="agency-heading">Agency Shifts</h1>
          <p className="muted">{user?.name ? `${user.name} · ` : ''}Post open shifts and track who claimed them.</p>
        </div>
      </header>

      <CreateShiftForm branches={branches.data ?? []} />

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
        ) : rows.length === 0 ? (
          <EmptyState title="No shifts match">Post a shift above or change the status filter.</EmptyState>
        ) : (
          <ShiftTable shifts={rows} />
        )}
      </section>
    </section>
  )
}
