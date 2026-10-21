import './AdminShiftsPage.scss'
import { useSearchParams } from 'react-router'
import { useBranches } from '../../entities/branch/use-branches/index.ts'
import { SHIFT_STATUSES as STATUSES, STATUS_LABEL } from '../../entities/shift/model/index.ts'
import { ShiftTable } from '../../entities/shift/ShiftTable/index.ts'
import { useAdminShifts } from '../../features/admin-dashboard/use-admin-shifts/index.ts'
import { toApiError } from '../../shared/api/errors/index.ts'
import { addDays } from '../../shared/lib/format/index.ts'
import { compactParams } from '../../shared/lib/search-params/index.ts'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'
import { ErrorState } from '../../shared/ui/ErrorState/index.ts'
import { LoadingState } from '../../shared/ui/LoadingState/index.ts'

const DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Global operational view: counts and filters only. Branch and date filters
 * run on the API; agency and status filters narrow the loaded list so the
 * status counts stay visible.
 */
export function AdminShiftsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = {
    status: STATUSES.find((s) => s === searchParams.get('status')),
    agency: searchParams.get('agency') ?? '',
    branch: searchParams.get('branch') ?? '',
    from: DATE.test(searchParams.get('from') ?? '') ? searchParams.get('from')! : '',
    to: DATE.test(searchParams.get('to') ?? '') ? searchParams.get('to')! : '',
  }
  const update = (patch: Partial<Record<keyof typeof filters, string>>) =>
    setSearchParams(compactParams({ ...filters, ...patch }), { replace: true })

  const branches = useBranches()
  const shifts = useAdminShifts({
    branchId: filters.branch || undefined,
    from: filters.from ? `${filters.from}T00:00:00Z` : undefined,
    to: filters.to ? `${addDays(filters.to, 1)}T00:00:00Z` : undefined,
  })

  const agencies = new Map((branches.data ?? []).map((b) => [b.agency.id, b.agency.name]))
  const visibleBranches = (branches.data ?? []).filter((b) => !filters.agency || b.agency.id === filters.agency)
  const inAgency = (shifts.data ?? []).filter((s) => !filters.agency || s.agency.id === filters.agency)
  const counts = Object.fromEntries(STATUSES.map((s) => [s, inAgency.filter((shift) => shift.status === s).length]))
  const rows = inAgency.filter((s) => !filters.status || s.status === filters.status)
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <section className="page" aria-labelledby="admin-heading">
      <header className="page__header">
        <div>
          <h1 id="admin-heading">All Shifts</h1>
          <p className="muted">Every agency, branch and nurse assignment.</p>
        </div>
      </header>

      <form className="card filters" aria-label="Filters" onSubmit={(e) => e.preventDefault()}>
        <label className="field">
          Agency
          <select
            value={filters.agency}
            onChange={(e) => update({ agency: e.target.value, branch: '' })}
          >
            <option value="">All agencies</option>
            {[...agencies].map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Branch
          <select value={filters.branch} onChange={(e) => update({ branch: e.target.value })}>
            <option value="">All branches</option>
            {visibleBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          From (UTC)
          <input type="date" value={filters.from} onChange={(e) => update({ from: e.target.value })} />
        </label>
        <label className="field">
          To (UTC)
          <input type="date" value={filters.to} onChange={(e) => update({ to: e.target.value })} />
        </label>
        {hasFilters && (
          <button type="button" className="btn btn--link" onClick={() => setSearchParams({}, { replace: true })}>
            Clear Filters
          </button>
        )}
      </form>

      <div className="stats" role="group" aria-label="Shifts by status">
        <button
          type="button"
          className="stat"
          aria-pressed={!filters.status}
          onClick={() => update({ status: '' })}
        >
          <span className="stat__value">{inAgency.length}</span>
          <span className="stat__label">All</span>
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`stat stat--${s}`}
            aria-pressed={filters.status === s}
            onClick={() => update({ status: filters.status === s ? '' : s })}
          >
            <span className="stat__value">{counts[s]}</span>
            <span className="stat__label">{STATUS_LABEL[s]}</span>
          </button>
        ))}
      </div>

      {shifts.data === undefined ? (
        shifts.isError ? (
          <ErrorState error={toApiError(shifts.error)} onRetry={() => void shifts.refetch()} />
        ) : (
          <LoadingState label="Loading shifts…" />
        )
      ) : rows.length === 0 ? (
        <EmptyState title="No shifts match these filters" />
      ) : (
        <ShiftTable shifts={rows} showAgency />
      )}
    </section>
  )
}
