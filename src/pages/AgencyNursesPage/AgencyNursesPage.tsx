import { useBranches } from '../../entities/branch/use-branches/index.ts'
import { NurseEligibilityTable } from '../../features/nurse-eligibility/NurseEligibilityTable/index.ts'
import { useAgencyNurses } from '../../features/nurse-eligibility/use-agency-nurses/index.ts'
import { toApiError } from '../../shared/api/errors/index.ts'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'
import { ErrorState } from '../../shared/ui/ErrorState/index.ts'
import { LoadingState } from '../../shared/ui/LoadingState/index.ts'

/** Agency users: which nurses may work at each of the agency's branches. */
export function AgencyNursesPage() {
  const nurses = useAgencyNurses()
  const branches = useBranches()
  const error = nurses.error ?? branches.error
  const refetch = () => {
    void nurses.refetch()
    void branches.refetch()
  }

  return (
    <section className="page" aria-labelledby="nurses-heading">
      <header className="page__header">
        <div>
          <h1 id="nurses-heading">Nurses</h1>
          <p className="muted">
            Activate a nurse at a branch to let them see and claim its open shifts. Suspending hides future shifts only.
          </p>
        </div>
      </header>

      {nurses.data === undefined || branches.data === undefined ? (
        error ? (
          <ErrorState error={toApiError(error)} onRetry={refetch} />
        ) : (
          <LoadingState label="Loading nurses…" />
        )
      ) : nurses.data.length === 0 ? (
        <EmptyState title="No nurses yet">
          Ask a ShiftPatch administrator to invite nurses to one of your branches.
        </EmptyState>
      ) : (
        <NurseEligibilityTable nurses={nurses.data} branches={branches.data} />
      )}
    </section>
  )
}
