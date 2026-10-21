import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import type { UserRole } from '../../../shared/api/client/index.ts'
import { homeFor, isAllowed } from '../navigation/index.ts'

/**
 * UX-only route guard: a screen that is not in the role's navigation renders
 * the "no access" state and fetches nothing. The API and the database make
 * every real authorization decision.
 */
export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { pathname } = useLocation()
  if (!isAllowed(role, pathname)) {
    return (
      <div className="state state--error" role="alert">
        <p className="state__title">You do not have access to this page</p>
        <p>
          This screen is for a different role. <Link to={homeFor(role)}>Go to your shifts</Link>
        </p>
      </div>
    )
  }
  return children
}
