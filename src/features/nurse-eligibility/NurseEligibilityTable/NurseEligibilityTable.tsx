import './NurseEligibilityTable.scss'
import type { Branch, NurseEligibility } from '../../../shared/api/client/index.ts'
import { EligibilityToggle } from '../EligibilityToggle/index.ts'
import { useSetEligibility } from '../use-set-eligibility/index.ts'

interface NurseEligibilityTableProps {
  nurses: NurseEligibility[]
  /** The caller's branches, one column each. Inactive ones are shown but locked. */
  branches: Branch[]
}

/** Nurses × branches grid: each cell is the nurse's status at that branch and the action that changes it. */
export function NurseEligibilityTable({ nurses, branches }: NurseEligibilityTableProps) {
  const setEligibility = useSetEligibility()
  const pendingKey = setEligibility.isPending ? `${setEligibility.variables.nurseId}:${setEligibility.variables.branchId}` : null

  return (
    <div className="table-wrap">
      <table className="table eligibility-table" data-testid="eligibility-table">
        <thead>
          <tr>
            <th scope="col">Nurse</th>
            {branches.map((branch) => (
              <th key={branch.id} scope="col">
                {branch.name}
                {branch.status === 'inactive' && <span className="muted small eligibility-table__note"> (inactive)</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {nurses.map(({ nurse, branches: records }) => (
            <tr key={nurse.id}>
              <th scope="row" className="table__cell--strong">
                {nurse.fullName}
              </th>
              {branches.map((branch) => {
                const record = records.find((entry) => entry.branch.id === branch.id)
                return (
                  <td key={branch.id} data-label={branch.name}>
                    <EligibilityToggle
                      nurseName={nurse.fullName}
                      branchName={branch.name}
                      status={record?.status ?? null}
                      disabled={branch.status !== 'active'}
                      pending={pendingKey === `${nurse.id}:${branch.id}`}
                      onChange={(status) =>
                        setEligibility.mutate({ nurseId: nurse.id, nurseName: nurse.fullName, branchId: branch.id, branchName: branch.name, status })
                      }
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
