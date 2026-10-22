import './ShiftTable.scss'
import { Fragment, useState } from 'react'
import type { Shift } from '../../../shared/api/client/index.ts'
import { ShiftHistory } from '../ShiftHistory/index.ts'
import { ShiftWhen } from '../ShiftWhen/index.ts'
import { StatusBadge } from '../StatusBadge/index.ts'

/** Operational shift table. Collapses into stacked rows on narrow screens. */
export function ShiftTable({ shifts, showAgency = false }: { shifts: Shift[]; showAgency?: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const columns = showAgency ? 6 : 5

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Role</th>
            {showAgency && <th scope="col">Agency</th>}
            <th scope="col">When</th>
            <th scope="col">Status</th>
            <th scope="col">Nurse</th>
            <th scope="col">
              <span className="visually-hidden">History</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {shifts.map((shift) => {
            const open = expanded === shift.id
            return (
              <Fragment key={shift.id}>
                <tr>
                  <td data-label="Role" className="table__cell--strong">
                    {shift.role}
                  </td>
                  {showAgency && <td data-label="Agency">{shift.agencyName}</td>}
                  <td data-label="When">
                    <ShiftWhen shift={shift} />
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={shift.status} />
                  </td>
                  <td data-label="Nurse">{shift.claimedBy ?? <span className="muted">Unassigned</span>}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--link"
                      aria-expanded={open}
                      aria-controls={`history-${shift.id}`}
                      onClick={() => setExpanded(open ? null : shift.id)}
                    >
                      {open ? 'Hide History' : 'History'}
                    </button>
                  </td>
                </tr>
                {open && (
                  <tr className="table__history-row">
                    <td colSpan={columns} id={`history-${shift.id}`}>
                      <ShiftHistory shiftId={shift.id} />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
