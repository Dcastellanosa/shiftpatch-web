import './ShiftTable.css'
import { Fragment, useState } from 'react'
import type { Shift } from '../../lib/api-client/api-client.ts'
import { ShiftHistory } from '../ShiftHistory/ShiftHistory.tsx'
import { ShiftWhen } from '../ShiftWhen/ShiftWhen.tsx'
import { StatusBadge } from '../StatusBadge/StatusBadge.tsx'

/** Operational shift table. Collapses into stacked rows on narrow screens. */
export function ShiftTable({ shifts, showAgency = false }: { shifts: Shift[]; showAgency?: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const columns = showAgency ? 7 : 6

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Shift</th>
            {showAgency && <th scope="col">Agency</th>}
            <th scope="col">Branch</th>
            <th scope="col">When</th>
            <th scope="col">Status</th>
            <th scope="col">Assigned Nurse</th>
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
                  <td data-label="Shift" className="cell-strong">
                    {shift.title}
                  </td>
                  {showAgency && <td data-label="Agency">{shift.agency.name}</td>}
                  <td data-label="Branch">{shift.branch.name}</td>
                  <td data-label="When">
                    <ShiftWhen shift={shift} />
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={shift.status} />
                  </td>
                  <td data-label="Assigned Nurse">
                    {shift.assignedNurse ? shift.assignedNurse.fullName : <span className="muted">Unassigned</span>}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-link"
                      aria-expanded={open}
                      aria-controls={`history-${shift.id}`}
                      onClick={() => setExpanded(open ? null : shift.id)}
                    >
                      {open ? 'Hide History' : 'History'}
                    </button>
                  </td>
                </tr>
                {open && (
                  <tr className="history-row">
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
