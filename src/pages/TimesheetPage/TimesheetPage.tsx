import './TimesheetPage.scss'
import { useTimesheets } from '../../entities/timesheet/queries/index.ts'
import { toApiError } from '../../shared/api/errors/index.ts'
import { formatLocalDate, formatLocalTimeRange } from '../../shared/lib/format/index.ts'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'
import { ErrorState } from '../../shared/ui/ErrorState/index.ts'
import { LoadingState } from '../../shared/ui/LoadingState/index.ts'

const STATUS_LABEL = { scheduled: 'Scheduled', worked: 'Worked' } as const

/** Read-only timesheet derived from filled shifts (own shifts, the agency's, or everything for an admin). */
export function TimesheetPage() {
  const timesheets = useTimesheets()

  return (
    <section className="page" aria-labelledby="timesheets-heading">
      <header className="page__header">
        <div>
          <h1 id="timesheets-heading">Timesheets</h1>
          <p className="muted">Scheduled hours per filled shift, by nurse and agency.</p>
        </div>
      </header>

      {timesheets.data === undefined ? (
        timesheets.isError ? (
          <ErrorState error={toApiError(timesheets.error)} onRetry={() => void timesheets.refetch()} />
        ) : (
          <LoadingState label="Loading timesheets…" />
        )
      ) : timesheets.data.length === 0 ? (
        <EmptyState title="No timesheet entries yet">Entries appear once a shift is filled.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table timesheet-table" data-testid="timesheet-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Nurse</th>
                <th scope="col">Agency</th>
                <th scope="col">Role</th>
                <th scope="col">Time</th>
                <th scope="col">Hours</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.data.map((row) => (
                <tr key={row.shiftId}>
                  <td data-label="Date">
                    <time dateTime={row.date}>{formatLocalDate(row.date)}</time>
                  </td>
                  <td data-label="Nurse" className="table__cell--strong">
                    {row.nurseName}
                  </td>
                  <td data-label="Agency">{row.agencyName}</td>
                  <td data-label="Role">{row.role}</td>
                  <td data-label="Time">{formatLocalTimeRange(row.startTime, row.endTime)}</td>
                  <td data-label="Hours">{row.scheduledHours}</td>
                  <td data-label="Status">
                    <span className={`badge badge--timesheet-${row.status}`}>{STATUS_LABEL[row.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
