import { ShiftTable } from '../components/ShiftTable.tsx'
import { EmptyState, ErrorState, LoadingState } from '../components/States.tsx'
import { listBranches, listShifts } from '../lib/api-client.ts'
import { addDays } from '../lib/format.ts'
import { setSearchParams, useLocation } from '../lib/router.ts'
import { SHIFT_STATUSES as STATUSES, STATUS_LABEL } from '../lib/status.ts'
import { useAsync } from '../lib/use-async.ts'

const DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Global operational view: counts and filters only. Branch and date filters
 * run on the API; agency and status filters narrow the loaded list so the
 * status counts stay visible.
 */
export function AdminShiftsPage() {
  const { search } = useLocation()
  const filters = {
    status: STATUSES.find((s) => s === search.get('status')),
    agency: search.get('agency') ?? '',
    branch: search.get('branch') ?? '',
    from: DATE.test(search.get('from') ?? '') ? search.get('from')! : '',
    to: DATE.test(search.get('to') ?? '') ? search.get('to')! : '',
  }
  const update = (patch: Partial<Record<keyof typeof filters, string>>) =>
    setSearchParams({ ...filters, ...patch } as Record<string, string>)

  const branches = useAsync(listBranches, 'branches')
  const shifts = useAsync(
    () =>
      listShifts({
        branchId: filters.branch || undefined,
        from: filters.from ? `${filters.from}T00:00:00Z` : undefined,
        to: filters.to ? `${addDays(filters.to, 1)}T00:00:00Z` : undefined,
      }),
    `admin:${filters.branch}:${filters.from}:${filters.to}`,
  )

  const agencies = new Map((branches.data ?? []).map((b) => [b.agency.id, b.agency.name]))
  const visibleBranches = (branches.data ?? []).filter((b) => !filters.agency || b.agency.id === filters.agency)
  const inAgency = (shifts.data ?? []).filter((s) => !filters.agency || s.agency.id === filters.agency)
  const counts = Object.fromEntries(STATUSES.map((s) => [s, inAgency.filter((shift) => shift.status === s).length]))
  const rows = inAgency.filter((s) => !filters.status || s.status === filters.status)
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <section className="page" aria-labelledby="admin-heading">
      <header className="page-header">
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
          <button type="button" className="btn btn-link" onClick={() => setSearchParams({})}>
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
          <span className="stat-value">{inAgency.length}</span>
          <span className="stat-label">All</span>
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`stat stat-${s}`}
            aria-pressed={filters.status === s}
            onClick={() => update({ status: filters.status === s ? '' : s })}
          >
            <span className="stat-value">{counts[s]}</span>
            <span className="stat-label">{STATUS_LABEL[s]}</span>
          </button>
        ))}
      </div>

      {shifts.error ? (
        <ErrorState error={shifts.error} onRetry={shifts.reload} />
      ) : !shifts.data ? (
        <LoadingState label="Loading shifts…" />
      ) : rows.length === 0 ? (
        <EmptyState title="No shifts match these filters" />
      ) : (
        <ShiftTable shifts={rows} showAgency />
      )}
    </section>
  )
}
